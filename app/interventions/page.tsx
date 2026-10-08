import { AppShell } from "@/components/app-shell";
import { InterventionForm } from "@/components/intervention-form";
import { requireServerSession } from "@/lib/auth/server";
import { getCommandData } from "@/lib/data/command";

export const dynamic = "force-dynamic";

export default async function InterventionsPage() {
  const session = await requireServerSession();
  const data = await getCommandData(session.tenantId);
  const active = data.interventions.filter((i) => i.status === "active" || i.status === "review_due").length;
  return (
    <AppShell title="Actions">
      <div className="pageHeader">
        <div><div className="eyebrow">Intervention engine</div><h1 className="pageTitle">From signal to measured outcome</h1><p className="pageSubtitle">Assign ownership, preserve the rationale and baseline, schedule review, and record whether the intervention actually changed the outcome.</p></div>
        <InterventionForm students={data.students.map((s) => ({ id: s.id, name: s.name, class: s.class }))} />
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Intervention register</h2><span className="sectionMeta">{active} active/reviewing</span></div>
        <div className="tableWrap"><table><thead><tr><th>Intervention</th><th>Students</th><th>Status</th><th>Review</th><th>Success metric</th><th>Observed outcome</th></tr></thead><tbody>{data.interventions.map((i) => <tr key={i.id}><td className="rowLink">{i.title}</td><td>{i.studentCount}</td><td><span className={`badge ${i.status}`}>{i.status.replace("_", " ")}</span></td><td>{i.reviewAt ? new Date(i.reviewAt).toLocaleString("en-IN", { dateStyle: "medium" }) : "—"}</td><td>{i.successMetric ?? "—"}</td><td>{i.outcomeValue ?? "Pending"}</td></tr>)}</tbody></table></div>
      </section>
      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Required before activation</h2><div className="kv"><div>Rationale</div><div>Why this action is justified</div><div>Evidence</div><div>Signals/data supporting the action</div><div>Owner</div><div>Named accountable person</div><div>Success metric</div><div>Observable measure + baseline</div><div>Review date</div><div>When effectiveness will be evaluated</div></div></section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Guardrail</h2><div className="emptyNote">Orynt may recommend or draft an intervention, but the default product never converts an inferred risk signal into punitive or high-impact action without an authorized human decision.</div></section>
      </div>
    </AppShell>
  );
}
