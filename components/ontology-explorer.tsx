"use client";
import { useMemo, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/data/graph";

function abbreviation(type: string) { return type.slice(0, 3).toUpperCase(); }

export function OntologyExplorer({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const [selected, setSelected] = useState<string | null>(nodes[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [zoom, setZoom] = useState(1);
  const types = useMemo(() => ["All", ...Array.from(new Set(nodes.map((node) => node.type))).sort()], [nodes]);
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const groups = new Map<string, GraphNode[]>();
    for (const node of nodes) groups.set(node.type, [...(groups.get(node.type) ?? []), node]);
    const ordered = [...groups.entries()];
    ordered.forEach(([, group], ringIndex) => {
      const radius = 95 + ringIndex * 34;
      group.forEach((node, index) => {
        const angle = (index / Math.max(1, group.length)) * Math.PI * 2 + ringIndex * 0.38;
        map.set(node.id, { x: 500 + Math.cos(angle) * radius, y: 360 + Math.sin(angle) * radius });
      });
    });
    return map;
  }, [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const active = selected ? nodeById.get(selected) : undefined;
  const relationships = useMemo(() => selected ? edges.filter((edge) => edge.source === selected || edge.target === selected) : [], [edges, selected]);
  const neighborhood = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected]);
    for (const edge of relationships) { set.add(edge.source); set.add(edge.target); }
    return set;
  }, [selected, relationships]);
  const normalizedQuery = query.trim().toLowerCase();
  const searchMatches = useMemo(() => normalizedQuery ? nodes.filter((node) => `${node.label} ${node.detail} ${node.type}`.toLowerCase().includes(normalizedQuery)).slice(0, 8) : [], [nodes, normalizedQuery]);
  function nodeOpacity(node: GraphNode) {
    if (type !== "All" && node.type !== type) return 0.12;
    if (normalizedQuery && !`${node.label} ${node.detail} ${node.type}`.toLowerCase().includes(normalizedQuery) && !neighborhood.has(node.id)) return 0.15;
    if (selected && !neighborhood.has(node.id)) return 0.22;
    return 1;
  }
  return <div style={{ display: "grid", gap: 12 }}><section className="card cardPad"><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><input className="searchBox" style={{ flex: 1, minWidth: 240 }} placeholder="Search students, concepts, assessments, signals, incidents…" value={query} onChange={(e) => setQuery(e.target.value)}/><select className="searchBox" value={type} onChange={(e) => setType(e.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select><button className="button secondary" onClick={() => setZoom((value) => Math.max(.55, value - .15))}>−</button><span className="muted" style={{ fontSize: 11 }}>{Math.round(zoom * 100)}%</span><button className="button secondary" onClick={() => setZoom((value) => Math.min(1.8, value + .15))}>+</button><button className="button secondary" onClick={() => { setZoom(1); setSelected(null); setQuery(""); setType("All"); }}>Reset</button></div>{searchMatches.length ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{searchMatches.map((node) => <button className="button secondary" key={node.id} onClick={() => setSelected(node.id)}>{node.type}: {node.label}</button>)}</div> : null}</section><div className="grid" style={{ gridTemplateColumns: "minmax(0,2.2fr) minmax(290px,1fr)", gap: 16 }}><div className="card" style={{ overflow: "auto", minHeight: 720 }}><svg viewBox="0 0 1000 720" style={{ width: "100%", minWidth: 760, minHeight: 650 }}><g transform={`translate(500 360) scale(${zoom}) translate(-500 -360)`}>{edges.map((edge, index) => { const a = positions.get(edge.source); const b = positions.get(edge.target); if (!a || !b) return null; const isActive = selected === edge.source || selected === edge.target; return <g key={`${edge.source}:${edge.target}:${index}`} opacity={selected && !isActive ? .08 : isActive ? .85 : .18}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth={isActive ? 1.8 : 1}/>{isActive ? <text x={(a.x+b.x)/2} y={(a.y+b.y)/2} fontSize="8" textAnchor="middle">{edge.label}</text> : null}</g>; })}{nodes.map((node) => { const p = positions.get(node.id); if (!p) return null; const isActive = selected === node.id; const opacity = nodeOpacity(node); return <g key={node.id} onClick={() => setSelected(node.id)} style={{ cursor: "pointer" }} opacity={opacity}><circle cx={p.x} cy={p.y} r={isActive ? 27 : 19} fill="var(--panel-2)" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1}/><text x={p.x} y={p.y+3} textAnchor="middle" fontSize="7.5" fontWeight="700">{abbreviation(node.type)}</text>{isActive || opacity === 1 ? <text x={p.x} y={p.y+34} textAnchor="middle" fontSize="8">{node.label.slice(0, 24)}</text> : null}</g>; })}</g></svg></div><section className="card cardPad"><div className="eyebrow">Ontology object</div>{active ? <><h2 className="sectionTitle" style={{ marginTop: 8 }}>{active.label}</h2><div className="kv" style={{ marginTop: 14 }}><div>Type</div><div>{active.type}</div><div>Detail</div><div>{active.detail}</div><div>Relationships</div><div>{relationships.length}</div></div><h3 style={{ fontSize: 12, marginTop: 20 }}>Neighborhood</h3><div style={{ marginTop: 8 }}>{relationships.length ? relationships.slice(0, 18).map((edge, index) => { const outward = edge.source === active.id; const other = nodeById.get(outward ? edge.target : edge.source); return <button key={`${edge.source}:${edge.target}:${index}`} onClick={() => setSelected(other?.id ?? null)} className="signal" style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", border: 0 }}><strong style={{ fontSize: 11 }}>{outward ? edge.label : `← ${edge.label}`}</strong><p>{other?.type}: {other?.label ?? "unknown"}</p></button>; }) : <div className="emptyNote">No visible relationships.</div>}</div></> : <div className="emptyNote" style={{ marginTop: 12 }}>Select an object to focus its one-hop neighborhood. Search and type filters dim unrelated objects without discarding graph context.</div>}</section></div></div>;
}
