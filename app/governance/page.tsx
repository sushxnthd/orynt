import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";

export default async function GovernancePage() {
  await requireServerAction("audit:read");
  return (
    <AppShell title="Governance">
      <div className="pageHeader"><div><div className="eyebrow">Trust + control</div><h1 className="pageTitle">Policy is part of the product</h1><p className="pageSubtitle">Access control, auditability, retention, explanation and human review are platform primitives—not a compliance layer added after deployment.</p></div></div>
      <div className="grid twoCol">
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 14 }}>Default controls</h2><div className="kv"><div>Tenant isolation</div><div>Every domain object carries a tenant boundary</div><div>Role authorization</div><div>Action-based RBAC with optional grade/class/subject scope</div><div>Audit trail</div><div>Actor, action, target, reason, before/after and request reference</div><div>Signal provenance</div><div>Rule version, evidence references and confidence</div><div>Human review</div><div>Required for high-impact interventions and Vision events</div><div>AI access</div><div>Tools receive only policy-authorized context</div></div></section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 14 }}>Sensitive defaults</h2><div className="emptyNote">Student-facing and parent-facing access remains fail-closed until explicit self/dependent relationships can be enforced. Counselor notes, internal deliberation, raw Vision footage, or unrelated student information must never appear merely because the graph can connect them.</div><div className="emptyNote" style={{ marginTop: 10 }}>Orynt Vision defaults to event metadata rather than biometric identity. Retention and snapshot storage are explicit tenant policies.</div></section>
      </div>
      <section className="card" style={{ marginTop: 16 }}><div className="sectionHead"><h2 className="sectionTitle">Role model</h2><span className="sectionMeta">Initial policy matrix</span></div><div className="tableWrap"><table><thead><tr><th>Role</th><th>Typical scope</th><th>High-impact capabilities</th></tr></thead><tbody><tr><td>Principal</td><td>School</td><td>Review interventions, governance and Vision incidents</td></tr><tr><td>Coordinator</td><td>Grade / classes</td><td>Assessment + intervention workflow</td></tr><tr><td>Teacher</td><td>Assigned courses</td><td>Attendance, assessments, scoped interventions</td></tr><tr><td>Counselor</td><td>Assigned students</td><td>Sensitive support context</td></tr><tr><td>IT admin</td><td>Systems</td><td>Connectors, imports, audit diagnostics</td></tr><tr><td>Student / parent</td><td>Future self / dependent relationship</td><td>Broad record access disabled until relationship scoping ships</td></tr></tbody></table></div></section>
    </AppShell>
  );
}
