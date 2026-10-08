import { AppShell } from "@/components/app-shell";
import { demoVisionEvents } from "@/lib/demo";

export default function VisionPage() {
  return (
    <AppShell title="Orynt Vision">
      <div className="pageHeader">
        <div><div className="eyebrow">Safety + operations</div><h1 className="pageTitle">Event triage, not student surveillance</h1><p className="pageSubtitle">Vision converts existing camera streams into minimal operational events. Identity recognition, emotion inference and automated discipline are outside the default product.</p></div>
        <button className="button secondary">Camera health</button>
      </div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Cameras online</div><div className="metricValue">47/48</div><div className="metricDelta warn">1 needs attention</div></section>
        <section className="card metric"><div className="metricLabel">Events today</div><div className="metricValue">12</div><div className="metricDelta muted">3 shown as examples</div></section>
        <section className="card metric"><div className="metricLabel">Awaiting review</div><div className="metricValue">2</div><div className="metricDelta warn">Human verification required</div></section>
        <section className="card metric"><div className="metricLabel">Identity tracking</div><div className="metricValue" style={{ fontSize: 18 }}>Disabled</div><div className="metricDelta good">Default policy</div></section>
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Operational event queue</h2><span className="sectionMeta">Metadata retained by policy</span></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Event</th><th>Zone</th><th>Confidence</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{demoVisionEvents.map((e) => <tr key={e.id}><td className="rowLink">{e.type}</td><td>{e.zone}</td><td>{Math.round(e.confidence*100)}%</td><td>{e.time}</td><td><span className={`badge ${e.status}`}>{e.status}</span></td><td><button className="button secondary">Review</button></td></tr>)}</tbody>
        </table></div>
      </section>
      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Allowed default event classes</h2><div className="evidence"><span>Crowding</span><span>Queue buildup</span><span>After-hours occupancy</span><span>Restricted-zone entry</span><span>Possible fall</span><span>Camera outage/tamper</span><span>Evacuation occupancy</span></div></section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Explicit boundary</h2><div className="emptyNote">No persistent face recognition, emotion detection, attention scores, individual movement histories, or CCTV-derived behavioral/disciplinary labels in the default system.</div></section>
      </div>
    </AppShell>
  );
}
