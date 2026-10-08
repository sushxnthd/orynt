import Link from "next/link";
import { Activity, BellRing, Database, Eye, GraduationCap, LayoutDashboard, LogOut, Network, Search, ShieldCheck, Users } from "lucide-react";
import { can, type Action } from "@/lib/auth/policy";
import { getServerSession } from "@/lib/auth/server";

const nav: { href: string; label: string; icon: typeof LayoutDashboard; action: Action }[] = [
  { href: "/", label: "Command", icon: LayoutDashboard, action: "command:read" },
  { href: "/students", label: "Students", icon: Users, action: "student:read" },
  { href: "/interventions", label: "Actions", icon: Activity, action: "intervention:read" },
  { href: "/vision", label: "Vision", icon: Eye, action: "vision:read" },
  { href: "/graph", label: "Graph", icon: Network, action: "command:read" },
];

const system: { href: string; label: string; icon: typeof Database; action: Action }[] = [
  { href: "/connect", label: "Connect", icon: Database, action: "import:write" },
  { href: "/governance", label: "Governance", icon: ShieldCheck, action: "audit:read" },
];

export async function AppShell({ children, title = "School Command" }: { children: React.ReactNode; title?: string }) {
  const session = await getServerSession();
  const visibleNav = session ? nav.filter((item) => can(session.role, item.action)) : [];
  const visibleSystem = session ? system.filter((item) => can(session.role, item.action)) : [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">O</div><div className="brandText">Orynt</div></div>
        {visibleNav.length ? <div className="navGroup">
          <div className="navLabel">Operate</div>
          {visibleNav.map(({ href, label, icon: Icon }) => <Link href={href} className="navItem" key={href}><Icon size={16}/><span>{label}</span></Link>)}
        </div> : null}
        {visibleSystem.length ? <div className="navGroup">
          <div className="navLabel">Platform</div>
          {visibleSystem.map(({ href, label, icon: Icon }) => <Link href={href} className="navItem" key={href}><Icon size={16}/><span>{label}</span></Link>)}
        </div> : null}
        <div className="navBottom">
          <div className="persona">{session?.name ?? "Signed in"}<br/>{session?.role.replaceAll("_", " ") ?? ""}<br/>Orynt Academy</div>
          <form action="/api/auth/logout" method="post" style={{ marginTop: 10 }}><button className="navItem" type="submit" style={{ width: "100%", border: 0, cursor: "pointer" }}><LogOut size={16}/><span>Sign out</span></button></form>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="topbarMeta">{session?.name ?? "Orynt"} · 2026–27</div>
            <Search size={16}/><BellRing size={16}/><GraduationCap size={17}/>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
