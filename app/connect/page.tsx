import { AppShell } from "@/components/app-shell";
import { CsvImporter } from "@/components/csv-importer";

const connectors = [
  { name: "CSV", state: "ready", detail: "Preview, validate and commit roster or attendance files with lineage" },
  { name: "Excel", state: "next", detail: "Workbook adapter using the same mapping and validation contract" },
  { name: "OneRoster", state: "planned", detail: "Standards-based roster/course exchange" },
  { name: "Ed-Fi", state: "planned", detail: "Student data interoperability layer" },
  { name: "Google Workspace", state: "planned", detail: "Authorized Sheets/Drive ingestion" },
  { name: "School ERP adapter", state: "planned", detail: "Vendor-specific API/SFTP bridge" },
  { name: "ONVIF / VMS events", state: "planned", detail: "Vision event bridge; raw video stays local where possible" },
];

export default function ConnectPage() {
  return (
    <AppShell title="Orynt Connect">
      <div className="pageHeader"><div><div className="eyebrow">Data plane</div><h1 className="pageTitle">Connect before you replace</h1><p className="pageSubtitle">Orynt sits above existing systems first. Imports are mapped, validated, lineage-tracked and repeatable.</p></div></div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Connector catalog</h2><span className="sectionMeta">Adapter architecture</span></div>
        {connectors.map((c) => <div className="signal" key={c.name}><div className="signalTop"><div><h3>{c.name}</h3><p>{c.detail}</p></div><span className={`badge ${c.state === "ready" ? "stable" : "watch"}`}>{c.state}</span></div></div>)}
      </section>
      <CsvImporter />
      <section className="card cardPad" style={{ marginTop: 16 }}><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Import contract</h2><div className="kv"><div>1. Detect</div><div>File type, header row and candidate entity</div><div>2. Map</div><div>Source columns → Orynt ontology properties</div><div>3. Validate</div><div>Required fields, duplicates, reference integrity and value ranges</div><div>4. Preview</div><div>Show accepted/rejected rows before mutation</div><div>5. Commit</div><div>Upsert with tenant boundary and idempotency key</div><div>6. Lineage</div><div>Persist import, mapping, checksum and affected records</div></div></section>
    </AppShell>
  );
}
