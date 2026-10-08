import Link from "next/link";
import { Activity, BellRing, Database, Eye, GraduationCap, LayoutDashboard, Network, Search, ShieldCheck, Users } from "lucide-react";

const nav = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/interventions", label: "Actions", icon: Activity },
  { href: "/vision", label: "Vision", icon: Eye },
  { href: "/graph", label: "Graph", icon: Network },
];

const system = [
  { href: "/connect", label: "Connect", icon: Database },
  { href: "/governance", label: "Governance", icon: ShieldCheck },
];

export function AppShell({ children, title = "School Command" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">O</div><div className="brandText">Orynt</div></div>
        <div className="navGroup">
          <div className="navLabel">Operate</div>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link href={href} className="navItem" key={href}><Icon size={16}/><span>{label}</span></Link>
          ))}
        </div>
        <div className="navGroup">
          <div className="navLabel">Platform</div>
          {system.map(({ href, label, icon: Icon }) => (
            <Link href={href} className="navItem" key={href}><Icon size={16}/><span>{label}</span></Link>
          ))}
        </div>
        <div className="navBottom">
          <div className="persona">Orynt Academy<br/>Principal workspace<br/>Synthetic demonstration tenant</div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="topbarMeta">Orynt Academy · 2026–27</div>
            <Search size={16}/><BellRing size={16}/><GraduationCap size={17}/>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
