export type AipEvidence = {
  type: string;
  id: string;
  label: string;
  detail?: string;
};

export type AipToolCall = {
  tool: string;
  args: Record<string, unknown>;
  status: "completed" | "denied" | "failed";
};

export type AipResponse = {
  mode: "deterministic" | "provider-assisted";
  answer: string;
  evidence: AipEvidence[];
  toolCalls: AipToolCall[];
  actionProposal?: {
    type: "create_task" | "create_intervention";
    title: string;
    rationale: string;
  };
};
