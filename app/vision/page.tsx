import { AppShell } from "@/components/app-shell";
import { VisionReview } from "@/components/vision-review";
import { requireServerSession } from "@/lib/auth/server";
import { getVisionData } from "@/lib/data/vision";

export const dynamic = "force-dynamic";

export default async function VisionPage() {
  const session = await requireServerSession();
  const data = await getVisionData(session.tenantId);
  return (
    <AppShell title="Orynt Vision">
      <div className="pageHeader"><div><div className="eyebrow">Safety + operations</div><h1 className="pageTitle">Event triage, not student surveillance</h1><p className="pageSubtitle">Vision converts camera streams into minimal operational events. Identity recognition, emotion inference and automated discipline are outside the default product.</p></div></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Events loaded</div><div className="metricValue">{data.events.length}</div><div className="metricDelta muted">Current review window</div></section>
        <section className="card metric"><div className="metricLabel">Awaiting review</div><div className="metricValue">{data.awaitingReview}</div><div className="metricDelta warn">Human verification required</div></section>
        <section className="card metric"><div className="metricLabel">Confirmed</div><div className="metricValue">{data.confirmed}</div><div className="metricDelta muted">Needs/needed operational follow-up</div></section>
        <section className="card metric"><div className="metricLabel">Identity tracking</div><div className="metricValue" style={{ fontSize: 18 }}>Disabled</div><div className="metricDelta good">Default policy</div></section>
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Operational event queue</h2><span className="sectionMeta">Human-reviewed metadata</span></div>
        <div className="tableWrap"><table><thead><tr><th>Event</th><th>Zone</th><th>Camera</th><th>Confidence</th><th>Time</th><th>Status</th><th>Review</th></tr></thead><tbody>{data.events.map((e) => <tr key={e.id}><td className="rowLink">{e.eventType.replaceAll("_", " ")}</td><td>{e.zone}</td><td>{e.cameraExternalId}</td><td>{e.confidence == null ? "—" : `${Math.round(Number(e.confidence)*100)}%`}</td><td>{new Date(e.occurredAt).toLocaleString("en-IN")}</td><td><span className={`badge ${e.status}`}>{e.status}</span></td><td><VisionReview id={e.id} status={e.status}/></td></tr>)}</tbody></table></div>
      </section>
      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Allowed default event classes</h2><div className="evidence"><span>Crowding</span><span>Queue buildup</span><span>After-hours occupancy</span><span>Restricted-zone entry</span><span>Possible fall</span><span>Camera outage/tamper</span><span>Evacuation occupancy</span></div></section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Explicit boundary</h2><div className="emptyNote">No persistent face recognition, emotion detection, attention scores, individual movement histories, or CCTV-derived behavioral/disciplinary labels in the default system.</div></section>
      </div>
    </AppShell>
  );
}
