import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section className="card cardPad" style={{ width: "100%", maxWidth: 420 }}>
        <div className="brand" style={{ borderBottom: "1px solid var(--line)", color: "var(--text)", padding: "0 0 16px", marginBottom: 18 }}><div className="brandMark">O</div><div><div className="brandText">Orynt</div><div className="muted" style={{ fontSize: 11 }}>School Operating Intelligence</div></div></div>
        <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>Sign in</h1>
        <p className="pageSubtitle" style={{ marginBottom: 18 }}>Use the seeded synthetic tenant for local evaluation. Production credentials must be provisioned per school.</p>
        <LoginForm />
      </section>
    </main>
  );
}
