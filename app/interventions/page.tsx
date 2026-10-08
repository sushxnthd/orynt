import { AppShell } from "@/components/app-shell";
import { demoInterventions } from "@/lib/demo";

export default function InterventionsPage() {
  return (
    <AppShell title="Actions">
      <div className="pageHeader">
        <div><div className="eyebrow">Intervention engine</div><h1 className="pageTitle">From signal to measured outcome</h1><p className="pageSubtitle">Assign ownership, preserve the rationale and baseline, schedule review, and record whether the intervention actually changed the outcome.</p></div>
        <button className="button">Create intervention</button>
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Intervention register</h2><span className="sectionMeta">3 active/reviewing</span></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Intervention</th><th>Owner</th><th>Students</th><th>Status</th><th>Review</th><th>Observed outcome</th></tr></thead>
          <tbody>{demoInterventions.map((i) => <tr key={i.id}><td className="rowLink">{i.title}</td><td>{i.owner}</td><td>{i.students}</td><td><span className={`badge ${i.status}`}>{i.status.replace("_", " ")}</span></td><td>{i.review}</td><td>{i.outcome}</td></tr>)}</tbody>
        </table></div>
      </section>
      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Required before activation</h2><div className="kv"><div>Rationale</div><div>Why this action is justified</div><div>Evidence</div><div>Signals/data supporting the action</div><div>Owner</div><div>Named accountable person</div><div>Success metric</div><div>Observable measure + baseline</div><div>Review date</div><div>When effectiveness will be evaluated</div></div></section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Guardrail</h2><div className="emptyNote">Orynt may recommend or draft an intervention, but the default product never converts an inferred risk signal into punitive or high-impact action without an authorized human decision.</div></section>
      </div>
    </AppShell>
  );
}
