import Link from "next/link";

export default async function ForbiddenPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { action } = await searchParams;
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section className="card cardPad" style={{ width: "100%", maxWidth: 520 }}>
        <div className="brand" style={{ borderBottom: "1px solid var(--line)", color: "var(--text)", padding: "0 0 16px", marginBottom: 18 }}><div className="brandMark">O</div><div className="brandText">Orynt</div></div>
        <div className="eyebrow">Access policy</div>
        <h1 className="pageTitle" style={{ fontSize: 24 }}>You do not have access to this workspace.</h1>
        <p className="pageSubtitle">The current role does not satisfy the required policy{action ? ` (${action})` : ""}. Orynt denies access rather than returning a partially filtered administrative view.</p>
        <Link href="/" className="button" style={{ display: "inline-block", marginTop: 18 }}>Return</Link>
      </section>
    </main>
  );
}
