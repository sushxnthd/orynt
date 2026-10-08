import { AppShell } from "@/components/app-shell";
import { CsvImporter } from "@/components/csv-importer";
import { requireServerAction } from "@/lib/auth/server";
import { getPlatformHealth } from "@/lib/data/governance";

const connectors = [
  { name: "CSV", state: "ready", detail: "Preview, validate and commit roster or attendance files with lineage" },
  { name: "Excel", state: "next", detail: "Workbook adapter using the same mapping and validation contract" },
  { name: "OneRoster", state: "planned", detail: "Standards-based roster/course exchange" },
  { name: "Ed-Fi", state: "planned", detail: "Student data interoperability layer" },
  { name: "Google Workspace", state: "planned", detail: "Authorized Sheets/Drive ingestion" },
  { name: "School ERP adapter", state: "planned", detail: "Vendor-specific API/SFTP bridge" },
  { name: "ONVIF / VMS events", state: "planned", detail: "Vision event bridge; raw video stays local where possible" },
];

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const session = await requireServerAction("import:write");
  const health = await getPlatformHealth(session.tenantId);
  return (
    <AppShell title="Orynt Connect">
      <div className="pageHeader"><div><div className="eyebrow">Data plane</div><h1 className="pageTitle">Connect before you replace</h1><p className="pageSubtitle">Orynt sits above existing systems first. Imports are mapped, validated, lineage-tracked and repeatable.</p></div></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Healthy sources</div><div className="metricValue">{health.metrics.healthySources}</div><div className="metricDelta good">Current source registry</div></section>
        <section className="card metric"><div className="metricLabel">Stale / error sources</div><div className="metricValue">{health.metrics.unhealthySources}</div><div className={`metricDelta ${health.metrics.unhealthySources ? "warn" : "good"}`}>Needs data-admin review</div></section>
        <section className="card metric"><div className="metricLabel">Committed imports</div><div className="metricValue">{health.imports.filter((item) => item.status === "committed").length}</div><div className="metricDelta muted">Recent import history</div></section>
        <section className="card metric"><div className="metricLabel">Retention rules</div><div className="metricValue">{health.metrics.enabledRetentionPolicies}</div><div className="metricDelta muted">Enabled data classes</div></section>
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Configured source health</h2><span className="sectionMeta">Freshness + last sync</span></div>
        {health.sources.length ? <div className="tableWrap"><table><thead><tr><th>Source</th><th>Kind</th><th>Health</th><th>Last successful sync</th><th>Freshness target</th><th>Latest issue</th></tr></thead><tbody>{health.sources.map((source) => <tr key={source.id}><td className="rowLink">{source.name}</td><td>{source.kind}</td><td><span className={`badge ${source.health === "healthy" ? "stable" : source.health === "error" ? "critical" : "watch"}`}>{source.health}</span></td><td>{source.lastSuccessfulSyncAt ? new Date(source.lastSuccessfulSyncAt).toLocaleString("en-IN") : "—"}</td><td>{source.freshnessMinutes == null ? "—" : `${source.freshnessMinutes} min`}</td><td>{source.errorMessage ?? "—"}</td></tr>)}</tbody></table></div> : <div className="signal"><div className="emptyNote">No source systems are registered yet.</div></div>}
      </section>
      <CsvImporter />
      <section className="card" style={{ marginTop: 16 }}><div className="sectionHead"><h2 className="sectionTitle">Import history</h2><span className="sectionMeta">Lineage records</span></div>{health.imports.length ? <div className="tableWrap"><table><thead><tr><th>File</th><th>Kind</th><th>Status</th><th>Rows</th><th>Errors</th><th>Created</th></tr></thead><tbody>{health.imports.map((item) => <tr key={item.id}><td className="rowLink">{item.filename}</td><td>{item.kind}</td><td>{item.status}</td><td>{item.rowCount}</td><td>{item.errorCount}</td><td>{new Date(item.createdAt).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div> : <div className="signal"><div className="emptyNote">No committed imports yet.</div></div>}</section>
      <section className="card cardPad" style={{ marginTop: 16 }}><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Connector catalog</h2>{connectors.map((c) => <div className="signal" key={c.name}><div className="signalTop"><div><h3>{c.name}</h3><p>{c.detail}</p></div><span className={`badge ${c.state === "ready" ? "stable" : "watch"}`}>{c.state}</span></div></div>)}</section>
      <section className="card cardPad" style={{ marginTop: 16 }}><h2 className="sectionTitle" style={{ marginBottom: 12 }}>Import contract</h2><div className="kv"><div>1. Detect</div><div>File type, header row and candidate entity</div><div>2. Map</div><div>Source columns → Orynt ontology properties</div><div>3. Validate</div><div>Required fields, duplicates, reference integrity and value ranges</div><div>4. Preview</div><div>Show accepted/rejected rows before mutation</div><div>5. Commit</div><div>Upsert with tenant boundary and idempotency key</div><div>6. Lineage</div><div>Persist import, mapping, checksum and affected records</div></div></section>
    </AppShell>
  );
}
