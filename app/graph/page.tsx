import { AppShell } from "@/components/app-shell";
import { OntologyExplorer } from "@/components/ontology-explorer";
import { requireServerAction } from "@/lib/auth/server";
import { getOntologyGraph } from "@/lib/data/graph";

export const dynamic = "force-dynamic";
export default async function GraphPage() { const session = await requireServerAction("command:read"); const graph = await getOntologyGraph(session.tenantId); return <AppShell title="School Graph"><div className="pageHeader"><div><div className="eyebrow">Live ontology</div><h1 className="pageTitle">Traverse the school as connected objects</h1><p className="pageSubtitle">This explorer is generated from tenant records, not a static architecture diagram. Relationship visibility is still bounded by the page permission.</p></div></div><OntologyExplorer nodes={graph.nodes} edges={graph.edges}/></AppShell>; }
