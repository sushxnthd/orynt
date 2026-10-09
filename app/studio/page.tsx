import { desc, eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { StudioManager } from "@/components/studio-manager";
import { requireServerAction } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { studioDefinitions } from "@/lib/db/frontier-schema";

export const dynamic = "force-dynamic";
export default async function StudioPage() {
  const session = await requireServerAction("studio:read");
  const definitions = await getDb().select().from(studioDefinitions).where(eq(studioDefinitions.tenantId, session.tenantId)).orderBy(desc(studioDefinitions.updatedAt));
  return <AppShell title="Orynt Studio"><div className="pageHeader"><div><div className="eyebrow">Configuration layer</div><h1 className="pageTitle">Adapt Orynt to the school without forking the product</h1><p className="pageSubtitle">Define tenant-specific object types, metrics and workflows as versioned metadata. Platform permissions still govern who can create or use them.</p></div></div><StudioManager initial={definitions}/></AppShell>;
}
