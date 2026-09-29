"use client";

import { Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Card, cn } from "./primitives";

/** Every chart ships with an accessible table-view twin. */
export function ChartCard({ title, subtitle, children, table, legend, className, badge }: { title: string; subtitle?: string; children: ReactNode; table: { columns: string[]; rows: (string | number)[][] }; legend?: { label: string; color: string }[]; className?: string; badge?: ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {badge}
          <button type="button" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable} className={cn("grid size-9 place-items-center rounded-lg transition-colors", showTable ? "bg-sky-50 text-sky-700" : "text-faint hover:bg-canvas")} aria-label={showTable ? "Show chart" : "Show as table"}>
            <Table2 className="size-4" />
          </button>
        </div>
      </div>
      {legend && legend.length > 1 && !showTable && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <span className="size-2.5 rounded-sm" style={{ background: l.color }} aria-hidden />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        {showTable ? (
          <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-line">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-canvas">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="px-3 py-2 font-semibold text-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-ink">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

export const CHART = {
  series1: "#2a78d6",
  series2: "#eb6834",
  series3: "#1baf7a",
  muted: "#c3cbd8",
  grid: "#e8edf4",
  axis: "#8593a8",
  good: "#0b8a4c",
  bad: "#cf3535",
};

export function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown> }[]; label?: string; format?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-float ring-1 ring-line">
      {label && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted">
          <span className="size-2 rounded-sm" style={{ background: p.color }} aria-hidden />
          {p.name}: <span className="font-semibold text-ink">{format && typeof p.value === "number" ? format(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}
