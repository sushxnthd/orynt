import type { Session } from "@/lib/auth/session";
import { can } from "@/lib/auth/policy";
import { runAipTool, type AipToolName } from "./tools";
import type { AipResponse, AipToolCall } from "./types";

function chooseTools(question: string): { tool: AipToolName; args: Record<string, unknown> }[] {
  const q = question.toLowerCase();
  const tools: { tool: AipToolName; args: Record<string, unknown> }[] = [];
  if (/risk|signal|why|attention|declin|problem/.test(q)) tools.push({ tool: "signals.list", args: {} });
  if (/intervention|action|support|remediation/.test(q)) tools.push({ tool: "interventions.list", args: {} });
  if (/vision|camera|cctv|crowd|gate|incident/.test(q)) tools.push({ tool: "vision.list", args: {} });
  if (/task|operation|incident|workflow/.test(q)) tools.push({ tool: "operations.summary", args: {} });
  const studentMatch = question.match(/(?:student|about|for)\s+([A-Za-z][A-Za-z .'-]{1,60})/i);
  if (studentMatch) tools.push({ tool: "students.search", args: { query: studentMatch[1].trim() } });
  if (!tools.length) tools.push({ tool: "signals.list", args: {} }, { tool: "interventions.list", args: {} });
  return tools.slice(0, 4);
}

async function providerSynthesis(question: string, safeContext: unknown): Promise<string | null> {
  const url = process.env.AIP_PROVIDER_URL;
  const key = process.env.AIP_API_KEY;
  const model = process.env.AIP_MODEL;
  if (!url || !key || !model) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: "You are Orynt AIP. Use only the permission-filtered evidence provided. Do not infer protected facts, do not identify people beyond the supplied records, and never present a recommendation as an automatic decision. Cite evidence labels inline where useful." },
        { role: "user", content: JSON.stringify({ question, evidence: safeContext }) },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content?.trim() || null;
}

export async function answerWithAip(session: Session, question: string): Promise<AipResponse> {
  if (!can(session.role, "aip:use")) throw new Error("permission_denied");
  const selected = chooseTools(question);
  const evidence = [] as AipResponse["evidence"];
  const toolCalls: AipToolCall[] = [];
  for (const item of selected) {
    try {
      const result = await runAipTool(session, item.tool, item.args);
      evidence.push(...result);
      toolCalls.push({ tool: item.tool, args: item.args, status: "completed" });
    } catch (error) {
      toolCalls.push({ tool: item.tool, args: item.args, status: error instanceof Error && error.message === "permission_denied" ? "denied" : "failed" });
    }
  }
  const uniqueEvidence = evidence.filter((item, index, all) => all.findIndex((other) => other.type === item.type && other.id === item.id) === index).slice(0, 24);
  const generated = await providerSynthesis(question, uniqueEvidence);
  const completed = toolCalls.filter((call) => call.status === "completed").length;
  const answer = generated ?? (uniqueEvidence.length
    ? `Orynt inspected ${completed} authorized workspace${completed === 1 ? "" : "s"} and found ${uniqueEvidence.length} relevant evidence item${uniqueEvidence.length === 1 ? "" : "s"}. Review the evidence before taking action.`
    : "Orynt could not find authorized evidence for that request. No hidden or out-of-scope records were used.");

  const q = question.toLowerCase();
  const actionProposal = /create|assign|follow.?up|intervention|task/.test(q) && uniqueEvidence.length
    ? { type: /intervention/.test(q) ? "create_intervention" as const : "create_task" as const, title: `Follow up: ${uniqueEvidence[0].label}`.slice(0, 180), rationale: `Proposed from the current authorized evidence set; requires explicit human confirmation before writing.` }
    : undefined;

  return { mode: generated ? "provider-assisted" : "deterministic", answer, evidence: uniqueEvidence, toolCalls, actionProposal };
}
