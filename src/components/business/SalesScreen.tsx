"use client";

import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { CHART, ChartCard, ChartTooltip } from "@/components/ui/chart-card";
import { Badge, Button, Card, Stat, cn } from "@/components/ui/primitives";
import { getSeed } from "@/lib/data";
import { dateFromOffset, formatINR, formatINRCompact, shortDate } from "@/lib/data/format";
import { BASKET_PAIRS, HOURLY_BEFORE, HOURLY_NOW, HOURS, weeklySeries } from "@/lib/data/sales";
import { pctChange, STORY } from "@/lib/data/story";
import { useGalla } from "@/lib/store/provider";

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;
const minuteLabel = (m: number) => {
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const dayLabel = (o: number) => (o === 0 ? "Today" : o === -1 ? "Yesterday" : shortDate(dateFromOffset(o)));

export function SalesScreen() {
  const { state, sendMessage, busy } = useGalla();
  const { daily, transactions } = getSeed();
  const weeks = useMemo(() => weeklySeries(daily), [daily]);
  const hourly = useMemo(() => HOURS.map((h, i) => ({ hour: hourLabel(h), before: HOURLY_BEFORE[i], now: HOURLY_NOW[i] })), []);
  const [limit, setLimit] = useState(15);

  const last7 = transactions.filter((t) => t.dayOffset <= -1 && t.dayOffset >= -7);
  const modes = (["UPI", "Cash", "Card"] as const).map((m, i) => ({ mode: m, amount: last7.filter((t) => t.mode === m).reduce((s, t) => s + t.amount, 0), color: [CHART.series1, CHART.series2, CHART.series3][i] }));
  const modeTotal = modes.reduce((s, m) => s + m.amount, 0) || 1;
  const top = [...state.products].sort((a, b) => b.price * b.dailyVelocity - a.price * a.dailyVelocity).slice(0, 5);
  const declining = state.products.filter((p) => p.stock === 0 || p.trendPct <= -5).sort((a, b) => a.trendPct - b.trendPct);
  const aov = STORY.last30Revenue / STORY.last30Txns;

  return (
    <div className="pb-2">
      <ScreenHeader title="Sales" subtitle="Payments, trends and products" />
      <div className="space-y-3.5 px-4 pt-2">
        <Card className="grid grid-cols-3 gap-2 p-4">
          <Stat label="This week" value={formatINRCompact(STORY.last7Revenue)} delta="−11%" tone="down" sub="vs normal" />
          <Stat label="30 days" value={formatINRCompact(STORY.last30Revenue)} delta={`+${pctChange(STORY.last30Revenue, STORY.prev30Revenue).toFixed(1)}%`} tone="up" />
          <Stat label="Avg order" value={`₹${aov.toFixed(0)}`} delta="+3.1%" tone="up" />
        </Card>

        <ChartCard
          title="Weekly sales · last 12 weeks"
          subtitle="This week fell below your 4-week average of ₹43,150"
          table={{ columns: ["Week ending", "Revenue", "Transactions"], rows: weeks.map((w) => [w.label, formatINR(w.revenue), w.txns]) }}
        >
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 14, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={2} />
                <YAxis tickFormatter={(v: number) => `${v / 1000}K`} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={40} domain={[0, 50000]} />
                <Tooltip content={<ChartTooltip format={formatINR} />} cursor={{ fill: "rgba(44,197,201,0.08)" }} />
                <ReferenceLine y={STORY.fourWeekWeeklyAvg} stroke={CHART.axis} strokeWidth={1} label={{ value: "4-week avg", position: "insideTopLeft", fontSize: 10, fill: CHART.axis }} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={20}>
                  {weeks.map((w) => (
                    <Cell key={w.label} fill={w.week === 0 ? CHART.series1 : CHART.muted} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Transactions by hour"
          subtitle="Evenings (5–9 PM) dropped 18%; mornings are steady"
          legend={[
            { label: "Previous 4 weeks", color: CHART.muted },
            { label: "This week", color: CHART.series1 },
          ]}
          table={{ columns: ["Hour", "Previous 4 weeks / day", "This week / day"], rows: hourly.map((h) => [h.hour, h.before, h.now]) }}
        >
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly} margin={{ top: 16, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <ReferenceArea x1="5p" x2="9p" fill="rgba(235,104,52,0.08)" label={{ value: "Evening −18%", position: "insideTop", fontSize: 10, fill: "#b8521f" }} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={34} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="before" name="Previous 4 weeks" stroke={CHART.muted} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="now" name="This week" stroke={CHART.series1} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Payment modes · last 7 days</h3>
          <div className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={modes.map((m) => `${m.mode} ${Math.round((m.amount / modeTotal) * 100)}%`).join(", ")}>
            {modes.map((m) => (
              <span key={m.mode} className="h-full" style={{ width: `${(m.amount / modeTotal) * 100}%`, background: m.color }} />
            ))}
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {modes.map((m) => (
              <li key={m.mode} className="text-[12px]">
                <span className="flex items-center gap-1 font-semibold text-muted">
                  <span className="size-2 rounded-sm" style={{ background: m.color }} aria-hidden />
                  {m.mode}
                </span>
                <span className="font-bold text-ink">{Math.round((m.amount / modeTotal) * 100)}%</span> <span className="text-faint">{formatINRCompact(m.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Best sellers · 30 days</h3>
          <ul className="mt-2 divide-y divide-line">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2 text-[13px]">
                <span className="w-4 text-faint">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {p.name} <span className="font-normal text-muted">{p.unit}</span>
                </span>
                <span className="tabular font-bold text-ink">{formatINRCompact(p.price * p.dailyVelocity * 30)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Declining products</h3>
          <ul className="mt-2 divide-y divide-line">
            {declining.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                <span className="min-w-0 truncate text-ink">{p.name}</span>
                {p.stock === 0 ? <Badge tone="bad">Out of stock</Badge> : <span className="flex items-center gap-1 font-bold text-bad"><TrendingDown className="size-3.5" aria-hidden />{p.trendPct}%</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-muted">Evening snacks (Kurkure, Coca-Cola, Bhujia) are falling with evening footfall.</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Bought together</h3>
          <ul className="mt-2 space-y-1.5">
            {BASKET_PAIRS.map((b) => (
              <li key={b.pair} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-ink">{b.pair}</span>
                <span className="shrink-0 text-muted">
                  <b className="text-ink">{b.share}%</b> of {b.when}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Button variant="primary" icon={Sparkles} className="w-full" disabled={busy} onClick={() => sendMessage("Nanna sales ee vaara yaake kadime aagide?")}>
          Ask Galla why sales dropped
        </Button>

        <Card className="overflow-hidden">
          <h3 className="px-4 pt-4 text-sm font-bold text-ink">Recent payments</h3>
          <ul className="mt-2 divide-y divide-line">
            {transactions.slice(0, limit).map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold", t.mode === "Cash" ? "bg-warn-50 text-warn" : "bg-sky-50 text-sky-700")}>{t.mode}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{t.label}</span>
                  <span className="block text-[11px] text-muted">
                    {dayLabel(t.dayOffset)} · {minuteLabel(t.minuteOfDay)}
                  </span>
                </span>
                <span className="tabular flex items-center gap-1 text-[13.5px] font-bold text-good">
                  <TrendingUp className="size-3" aria-hidden />
                  {formatINR(t.amount)}
                </span>
              </li>
            ))}
          </ul>
          {limit < transactions.length && (
            <button type="button" onClick={() => setLimit((l) => l + 25)} className="min-h-11 w-full border-t border-line text-[13px] font-semibold text-sky-700">
              Show more
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
