"use client";

import { Bookmark, History, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { LearningView } from "@/components/chat/MessageItem";
import { GallaMark } from "@/components/ui/ai-bits";
import { CHART, ChartCard, ChartTooltip } from "@/components/ui/chart-card";
import { Button, Card, cn } from "@/components/ui/primitives";
import { cashPosition } from "@/lib/cashflow/cashflow";
import { getSeed } from "@/lib/data";
import { formatINR, formatINRCompact } from "@/lib/data/format";
import { monthlySeries, weeklySeries } from "@/lib/data/sales";
import { pctChange, STORY } from "@/lib/data/story";
import { inventoryHealth } from "@/lib/inventory/inventory";
import { useGalla } from "@/lib/store/provider";

const REPEAT_WEEKLY = [226, 224, 222, STORY.repeatCustomersBefore, 216, 212, 208, STORY.repeatCustomersNow];

export function InsightsScreen() {
  const { state, navigate, sendMessage, busy } = useGalla();
  const { daily } = getSeed();
  const months = useMemo(() => monthlySeries(daily), [daily]);
  const repeat = useMemo(() => weeklySeries(daily, 8).map((w, i) => ({ label: w.label, customers: REPEAT_WEEKLY[i] })), [daily]);
  const inv = inventoryHealth(state.products);
  const pos = cashPosition(state.obligations, state.patterns);

  const kpis = [
    { label: "Revenue", value: `+${pctChange(STORY.last30Revenue, STORY.prev30Revenue).toFixed(1)}%`, sub: "30 days vs previous", tone: "up" },
    { label: "Repeat customers", value: `${pctChange(STORY.repeatCustomersNow, STORY.repeatCustomersBefore).toFixed(1)}%`, sub: "vs 4 weeks ago", tone: "down" },
    { label: "Average order value", value: "+3.1%", sub: `₹${(STORY.last30Revenue / STORY.last30Txns).toFixed(0)} per bill`, tone: "up" },
    { label: "Stock risk", value: `${inv.risk.length} products`, sub: `${inv.out.length} out of stock`, tone: inv.risk.length ? "warn" : "up" },
    { label: "Cashflow risk", value: formatINRCompact(pos.committed), sub: "committed in 30 days", tone: "warn" },
  ];

  return (
    <div className="pb-2">
      <ScreenHeader title="Insights" subtitle="What your numbers are saying" back={false} />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((k, i) => (
            <Card key={k.label} className={cn("p-3.5", i === 0 && "col-span-2")}>
              <p className="text-xs font-medium text-muted">{k.label}</p>
              <p className={cn("text-[22px] font-extrabold leading-tight", k.tone === "up" ? "text-good" : k.tone === "down" ? "text-bad" : "text-warn")}>{k.value}</p>
              <p className="text-[11px] text-faint">{k.sub}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <GallaMark size={22} />
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-navy">WHAT THIS MEANS</span>
          </div>
          <p className="mt-2 text-[14.5px] font-semibold leading-snug text-ink">Revenue is up, but loyalty is slipping. Growth came from new and occasional customers while regulars went quiet.</p>
          <Button className="mt-3" size="sm" icon={Sparkles} disabled={busy} onClick={() => sendMessage("Nanna sales ee vaara yaake kadime aagide?")}>
            Ask Galla what to do
          </Button>
        </Card>

        <ChartCard title="Monthly revenue grew steadily" subtitle="Last 12 months · latest month highlighted" table={{ columns: ["Month", "Revenue"], rows: months.map((m) => [m.label, formatINR(m.revenue)]) }}>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={1} />
                <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}K`} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={40} domain={[100000, 200000]} allowDataOverflow />
                <Tooltip content={<ChartTooltip format={formatINR} />} cursor={{ fill: "rgba(44,197,201,0.08)" }} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={18}>
                  {months.map((m, i) => (
                    <Cell key={m.label + i} fill={i === months.length - 1 ? CHART.series1 : CHART.muted} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="…while repeat customers fell 6.4%" subtitle="Regular customers who bought each week" table={{ columns: ["Week ending", "Repeat customers"], rows: repeat.map((r) => [r.label, r.customers]) }}>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repeat} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={1} />
                <YAxis domain={[195, 230]} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="customers" name="Repeat customers" stroke={CHART.series1} strokeWidth={2} dot={{ r: 3, fill: CHART.series1, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Learning loop</h2>
            <Button size="sm" variant="ghost" icon={History} onClick={() => navigate("history")}>
              Action history
            </Button>
          </div>
          {state.learnings.map((l) => (
            <LearningView key={l.id} learning={l} />
          ))}
        </section>

        {state.savedInsights.length > 0 && (
          <Card className="p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Bookmark className="size-4" aria-hidden /> Saved insights
            </h3>
            <ul className="mt-2 space-y-2">
              {state.savedInsights.map((s) => (
                <li key={s.id} className="text-[13px]">
                  <b className="text-ink">{s.title}</b>
                  <span className="block text-muted">{s.detail}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
