"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Badge, Card } from "@/components/ui/primitives";
import { SCAM_GRAPH_EDGES, SCAM_GRAPH_NODES, type GraphNodeType } from "@/lib/data/safety";

const NODE_STYLE: Record<GraphNodeType, { fill: string; label: string }> = {
  merchant: { fill: "#0d4f5c", label: "You" },
  supplier: { fill: "#1baf7a", label: "Supplier" },
  beneficiary: { fill: "#2a78d6", label: "Beneficiary" },
  customer: { fill: "#13908b", label: "Customers" },
  qr: { fill: "#136272", label: "QR code" },
  suspicious: { fill: "#cf3535", label: "Suspicious" },
  contact: { fill: "#eb6834", label: "Linked entity" },
};

export function ScamGraph() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState("s1");
  const visible = SCAM_GRAPH_NODES.filter((n) => !n.parent || expanded.has(n.parent));
  const ids = new Set(visible.map((n) => n.id));
  const edges = SCAM_GRAPH_EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));
  const byId = Object.fromEntries(SCAM_GRAPH_NODES.map((n) => [n.id, n]));
  const sel = byId[selected];
  const children = SCAM_GRAPH_NODES.filter((n) => n.parent === selected);

  const activate = (id: string) => {
    setSelected(id);
    if (SCAM_GRAPH_NODES.some((n) => n.parent === id)) {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-ink">Merchant scam graph</h3>
        <Badge tone="neutral">Your network</Badge>
      </div>
      <p className="text-[12px] text-muted">Tap a red node to expand the entities linked to it.</p>
      <svg viewBox="0 0 390 380" className="mt-2 w-full" role="group" aria-label="Scam graph of your payment network">
        {edges.map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          return (
            <g key={`${e.from}-${e.to}`}>
              <motion.line initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.suspicious ? "#cf3535" : "#c3cbd8"} strokeWidth={e.suspicious ? 1.6 : 1.2} strokeDasharray={e.suspicious ? "5 4" : undefined} style={e.suspicious ? { animation: "var(--animate-dash)" } : undefined} />
              {e.label && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize="8.5" fill="#b3261e" fontWeight={600}>
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        <AnimatePresence>
          {visible.map((n) => {
            const st = NODE_STYLE[n.type];
            const r = n.type === "merchant" ? 22 : n.type === "suspicious" ? 15 : 12;
            const anchor = n.x > 320 ? "end" : n.x < 60 ? "start" : "middle";
            const expandable = SCAM_GRAPH_NODES.some((c) => c.parent === n.id);
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                role="button"
                tabIndex={0}
                aria-label={`${n.label}, ${n.sub}${expandable ? `, ${expanded.has(n.id) ? "collapse" : "expand"} linked entities` : ""}`}
                aria-pressed={selected === n.id}
                onClick={() => activate(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate(n.id);
                  }
                }}
              >
                {n.type === "suspicious" && (
                  <motion.circle cx={n.x} cy={n.y} r={r} fill="none" stroke="#cf3535" strokeWidth={2} animate={{ r: [r, r + 10], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
                )}
                <circle cx={n.x} cy={n.y} r={r + 8} fill="transparent" />
                <circle cx={n.x} cy={n.y} r={r} fill={st.fill} stroke={selected === n.id ? "#2cc5c9" : "#fff"} strokeWidth={selected === n.id ? 3 : 2} />
                {expandable && (
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fontWeight={800} fill="#fff">
                    {expanded.has(n.id) ? "−" : "+"}
                  </text>
                )}
                <text x={n.x} y={n.y + r + 12} textAnchor={anchor} fontSize="10" fontWeight={700} fill="#0b1a33">
                  {n.label}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
      <div className="mt-1 rounded-xl bg-canvas p-3" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: NODE_STYLE[sel.type].fill }} aria-hidden />
          <p className="text-[13.5px] font-bold text-ink">{sel.label}</p>
          <span className="text-[11px] text-muted">{NODE_STYLE[sel.type].label}</span>
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted">{sel.sub}</p>
        {children.length > 0 && <p className="mt-1 text-[12px] text-ink">{expanded.has(sel.id) ? `Linked: ${children.map((c) => c.label).join(" · ")}` : `${children.length} linked entities — tap the node to expand`}</p>}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {(Object.keys(NODE_STYLE) as GraphNodeType[]).map((t) => (
          <li key={t} className="flex items-center gap-1 text-[11px] text-muted">
            <span className="size-2 rounded-full" style={{ background: NODE_STYLE[t].fill }} aria-hidden />
            {NODE_STYLE[t].label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
