import { AppShell } from "@/components/app-shell";
import { AskOrynt } from "@/components/ask-orynt";
import { requireServerAction } from "@/lib/auth/server";

export default async function AipPage() {
  await requireServerAction("aip:use");
  return <AppShell title="Orynt AIP"><div className="pageHeader"><div><div className="eyebrow">Permission-aware intelligence</div><h1 className="pageTitle">Investigate the school without bypassing its rules</h1><p className="pageSubtitle">AIP chooses from authorized Orynt tools, returns evidence, and requires explicit human confirmation before any write action. An external model is optional; the operational tools work without one.</p></div></div><section className="card cardPad"><AskOrynt expanded/></section><div className="grid twoCol" style={{ marginTop: 16 }}><section className="card cardPad"><h2 className="sectionTitle">Guardrails</h2><div className="emptyNote" style={{ marginTop: 10 }}>Tool calls inherit the signed-in role and tenant scope. A language model never receives records a tool was not allowed to return, and it cannot directly mutate school data.</div></section><section className="card cardPad"><h2 className="sectionTitle">Provider mode</h2><div className="emptyNote" style={{ marginTop: 10 }}>Set AIP_PROVIDER_URL, AIP_API_KEY and AIP_MODEL to enable provider-assisted synthesis. Without them, Orynt remains deterministic and evidence-first.</div></section></div></AppShell>;
}
