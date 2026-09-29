"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { SimulationView } from "@/components/chat/cards";
import { CHART, ChartCard, ChartTooltip } from "@/components/ui/chart-card";
import { Button, Card, Segmented } from "@/components/ui/primitives";
import { customerStats } from "@/lib/data/customers";
import { formatINR } from "@/lib/data/format";
import { simulateStorewide, simulateWinback } from "@/lib/simulation/whatIf";
import { useGalla } from "@/lib/store/provider";
import { currentCustomers } from "@/lib/store/selectors";

type Kind = "winback" | "storewide";

export function WhatIfScreen() {
  const { state, sendMessage, busy } = useGalla();
  const [kind, setKind] = useState<Kind>("winback");
  const [amount, setAmount] = useState(50);
  const audience = useMemo(() => customerStats(currentCustomers(state)).atRisk, [state]) || 47;

  const sim = kind === "winback" ? simulateWinback(amount, audience, state.calibration) : simulateStorewide(amount);
  const curve = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const a = (i + 1) * 10;
        return { amount: `₹${a}`, value: kind === "winback" ? Math.round(simulateWinback(a, audience, state.calibration).expected * 10) / 10 : simulateStorewide(a).marginImpact };
      }),
    [kind, audience, state.calibration],
  );
  const doubled = kind === "winback" ? simulateWinback(Math.min(200, amount * 2), audience, state.calibration).expected - simulateWinback(amount, audience, state.calibration).expected : 0;
  const current = curve.find((c) => c.amount === `₹${amount}`);

  return (
    <div className="pb-2">
      <ScreenHeader title="Merchant Twin" subtitle="What-if simulator · nothing is sent" />
      <div className="space-y-3.5 px-4 pt-2">
        <Segmented
          label="Offer type"
          value={kind}
          onChange={(v) => {
            setKind(v);
            setAmount(v === "winback" ? 50 : 100);
          }}
          options={[
            { value: "winback", label: "Targeted win-back" },
            { value: "storewide", label: "Store-wide discount" },
          ]}
        />

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="offer-amount" className="text-sm font-bold text-ink">
              {kind === "winback" ? "Offer per customer" : "Discount per bill"}
            </label>
            <span className="text-[22px] font-extrabold text-navy">₹{amount}</span>
          </div>
          <input id="offer-amount" type="range" min={10} max={200} step={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-3 w-full accent-[#0d4f5c]" />
          <p className="mt-1 text-[12px] text-muted">{kind === "winback" ? `Sent only to ${audience} regular customers inactive for 14+ days.` : "Available to every customer with a bill above ₹999."}</p>
        </Card>

        <SimulationView sim={sim} />

        <ChartCard
          title={kind === "winback" ? "Diminishing returns" : "Margin impact by discount"}
          subtitle={kind === "winback" ? (doubled < 1.5 ? `Doubling to ₹${Math.min(200, amount * 2)} adds only ~${doubled.toFixed(1)} customers` : "Higher offers still bring more customers here") : "Bigger discounts give away more margin to customers who'd buy anyway"}
          table={{ columns: [kind === "winback" ? "Offer" : "Discount", kind === "winback" ? "Expected returning" : "Margin impact"], rows: curve.map((c) => [c.amount, kind === "winback" ? c.value : formatINR(c.value)]) }}
        >
          <div className="h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="amount" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => (kind === "winback" ? String(v) : `${v / 1000}K`)} />
                {kind === "storewide" && <ReferenceLine y={0} stroke={CHART.axis} />}
                <Tooltip content={<ChartTooltip format={kind === "winback" ? (v) => `${v} customers` : formatINR} />} />
                <Line type="monotone" dataKey="value" name={kind === "winback" ? "Expected returning" : "Margin impact"} stroke={CHART.series1} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                {current && <ReferenceDot x={current.amount} y={current.value} r={6} fill={CHART.series1} stroke="#fff" strokeWidth={2} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Button className="w-full" size="lg" icon={Sparkles} disabled={busy} onClick={() => sendMessage(kind === "winback" ? `₹${amount} offer kotre enagutte?` : `₹${amount} discount kotre enagutte?`)}>
          Ask Galla to plan this
        </Button>
        <p className="text-center text-[11px] text-faint">Galla will prepare the campaign and wait for your approval.</p>
      </div>
    </div>
  );
}
