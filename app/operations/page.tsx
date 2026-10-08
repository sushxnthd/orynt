import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getOperationsData } from "@/lib/data/operations";

const dayNames = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const session = await requireServerAction("operations:read");
  const data = await getOperationsData(session.tenantId);
  return (
    <AppShell title="Operations">
      <div className="pageHeader"><div><div className="eyebrow">School operations</div><h1 className="pageTitle">Timetable, coverage and execution</h1><p className="pageSubtitle">Model the school as an operating system: rooms, scheduled teaching, substitutions, tasks and incidents live in the same graph as academic outcomes.</p></div></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Active rooms</div><div className="metricValue">{data.metrics.activeRooms}</div><div className="metricDelta muted">Modeled facilities</div></section>
        <section className="card metric"><div className="metricLabel">Substitutions</div><div className="metricValue">{data.metrics.substitutions}</div><div className="metricDelta warn">Recorded meetings</div></section>
        <section className="card metric"><div className="metricLabel">Open tasks</div><div className="metricValue">{data.metrics.openTasks}</div><div className="metricDelta warn">Operational queue</div></section>
        <section className="card metric"><div className="metricLabel">Open incidents</div><div className="metricValue">{data.metrics.openIncidents}</div><div className={`metricDelta ${data.metrics.openIncidents ? "bad" : "good"}`}>{data.metrics.openIncidents ? "Needs follow-up" : "No unresolved incident"}</div></section>
      </div>

      <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Timetable</h2><span className="sectionMeta">Recurring schedule</span></div><div className="tableWrap"><table><thead><tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead><tbody>{data.schedule.map((slot) => <tr key={slot.id}><td>{dayNames[slot.dayOfWeek] ?? slot.dayOfWeek}</td><td>{slot.period}</td><td>{slot.startsAt.slice(0,5)}–{slot.endsAt.slice(0,5)}</td><td className="rowLink">{slot.className}</td><td>{slot.subject}</td><td>{slot.teacher}</td><td>{slot.room}</td></tr>)}</tbody></table></div></section>

      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Teaching coverage</h2><span className="sectionMeta">Actual vs scheduled</span></div>{data.meetings.map((meeting) => <div className="signal" key={meeting.id}><div className="signalTop"><div><h3>{meeting.className} · {meeting.subject}</h3><p>{meeting.scheduledOn} · {meeting.teacher}{meeting.substitute ? ` → substitute ${meeting.substitute}` : ""}</p></div><span className={`badge ${meeting.status === "completed" ? "stable" : meeting.status === "substituted" ? "watch" : "action"}`}>{meeting.status}</span></div>{meeting.coverageNote ? <div className="evidence"><span>{meeting.coverageNote}</span></div> : null}</div>)}</section>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Tasks</h2><span className="sectionMeta">Execution queue</span></div>{data.tasks.map((task) => <div className="signal" key={task.id}><div className="signalTop"><div><h3>{task.title}</h3><p>{task.description ?? "No description"}{task.dueAt ? ` · due ${new Date(task.dueAt).toLocaleString("en-IN")}` : ""}</p></div><span className={`badge ${task.status === "done" ? "stable" : "watch"}`}>{task.status.replace("_", " ")}</span></div></div>)}</section>
      </div>

      <section className="card" style={{ marginTop: 16 }}><div className="sectionHead"><h2 className="sectionTitle">Incident register</h2><span className="sectionMeta">Vision and manual incidents share one workflow</span></div>{data.incidents.length ? data.incidents.map((incident) => <div className="signal" key={incident.id}><div className="signalTop"><div><h3>{incident.title}</h3><p>{incident.category} · {incident.zone ?? "no zone"} · {new Date(incident.occurredAt).toLocaleString("en-IN")}</p></div><span className={`badge ${incident.status === "resolved" || incident.status === "dismissed" ? "stable" : "action"}`}>{incident.status}</span></div>{incident.resolution ? <div className="evidence"><span>{incident.resolution}</span></div> : null}</div>) : <div className="signal"><div className="emptyNote">No incidents recorded.</div></div>}</section>
    </AppShell>
  );
}
