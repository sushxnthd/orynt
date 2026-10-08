import { AppShell } from "@/components/app-shell";

const nodes = [
  ["Student", "attendance · results · interventions"],
  ["Class", "grade · section · homeroom"],
  ["Course", "subject · teacher · academic year"],
  ["Concept", "curriculum · prerequisite · mastery"],
  ["Assessment", "date · max score · concepts"],
  ["Signal", "rule · evidence · confidence"],
  ["Intervention", "owner · baseline · outcome"],
  ["Vision event", "zone · event · review"],
] as const;

export default function GraphPage() {
  return (
    <AppShell title="School Graph">
      <div className="pageHeader"><div><div className="eyebrow">Ontology</div><h1 className="pageTitle">One operating model of the school</h1><p className="pageSubtitle">Orynt connects records by meaning and relationship, not merely by dashboard. Every action and explanation can traverse this graph subject to permissions.</p></div></div>
      <section className="card cardPad">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {nodes.map(([name, desc]) => <div key={name} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, background: "var(--panel-2)" }}><strong style={{ fontSize: 13 }}>{name}</strong><div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{desc}</div></div>)}
        </div>
      </section>
      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Example traversal</h2><ol className="timeline"><li>Student → enrolled in → Course</li><li>Course → assesses → Concept</li><li>Assessment result + attendance → supports → Signal</li><li>Signal → justifies → Intervention</li><li>Intervention → produces → Outcome evidence</li></ol></section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Ontology principle</h2><div className="emptyNote">Objects are tenant-scoped. Relationship traversal does not grant access by itself; the policy layer still evaluates the user, action, scope and target object before sensitive properties are returned.</div></section>
      </div>
    </AppShell>
  );
}
