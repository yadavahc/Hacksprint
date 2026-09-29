"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  FastForward,
  Landmark,
  Megaphone,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { AnimatedNumber, Avatar } from "@/components/ui/animated-number";
import { ConfidencePill, SimulatedBadge, WhyGallaThinks } from "@/components/ui/ai-bits";
import { Badge, Button, Card, ProgressBar, cn } from "@/components/ui/primitives";
import type { AgentResponse, Card as CardData } from "@/lib/agents/types";
import type { CashPosition, MandatePrediction } from "@/lib/cashflow/cashflow";
import type { Readiness } from "@/lib/credit/readiness";
import { SAMPLE_DOCUMENTS } from "@/lib/data/documents";
import { formatINR, formatINRCompact } from "@/lib/data/format";
import type { ExtractedField, InvoiceLine } from "@/lib/data/types";
import type { RiskAssessment } from "@/lib/risk/riskEngine";
import type { StorewideSimulation, WinbackSimulation } from "@/lib/simulation/whatIf";
import { useGalla } from "@/lib/store/provider";
import { snapshotOf } from "@/lib/store/selectors";

type Of<T extends CardData["type"]> = Extract<CardData, { type: T }>;

export function ResponseCard({ card, response }: { card: CardData; response: AgentResponse }) {
  switch (card.type) {
    case "briefing":
      return <BriefingCard items={card.items} />;
    case "insight":
      return <InsightCard card={card} uncertainty={response.uncertainty} />;
    case "customers":
      return <CustomersCard card={card} />;
    case "simulation":
      return <SimulationView sim={card.sim} />;
    case "campaign":
      return <CampaignTrackingCard campaignId={card.campaignId} />;
    case "cashflow":
      return <CashflowCard position={card.position} />;
    case "mandate":
      return <MandateView prediction={card.prediction} />;
    case "stock":
      return <StockCard items={card.items} />;
    case "risk":
      return <RiskView {...card} />;
    case "credit":
      return <CreditView readiness={card.readiness} />;
    case "invoice":
      return <InvoiceView documentId={card.documentId} />;
    case "catalog":
      return <CatalogPreviewCard item={card.item} />;
    case "obligation":
      return <ObligationCard card={card} />;
    case "capabilities":
      return <CapabilitiesCard />;
    case "cta":
      return <CtaRow buttons={card.buttons} />;
  }
}

// ------------------------------------------------------------------------------------------------

function BriefingCard({ items }: { items: Of<"briefing">["items"] }) {
  const { sendMessage, busy } = useGalla();
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-3 p-3">
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold", it.tone === "bad" ? "bg-bad-50 text-bad" : "bg-warn-50 text-warn")}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug text-ink">{it.title}</p>
            <p className="text-[11.5px] text-muted">{it.detail}</p>
          </div>
          <Button size="sm" variant={i === 0 ? "primary" : "outline"} onClick={() => sendMessage(it.prompt)} disabled={busy}>
            {i === 0 ? "Fix this" : "Ask"}
          </Button>
        </div>
      ))}
    </Card>
  );
}

const toneClass = (t?: string) => (t === "down" ? "text-bad" : t === "up" ? "text-good" : t === "warn" ? "text-warn" : "text-ink");

function InsightCard({ card, uncertainty }: { card: Of<"insight">; uncertainty?: string }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{card.metric.label}</p>
          <p className={cn("text-[30px] font-extrabold leading-tight", toneClass(card.metric.tone))}>{card.metric.value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-bad-50 text-bad">{card.metric.tone === "up" ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}</span>
      </div>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted">Evidence</p>
      <ul className="divide-y divide-line">
        {card.evidence.map((e) => (
          <li key={e.label} className="flex items-center justify-between gap-3 py-2 text-[13px]">
            <span className="text-ink">{e.label}</span>
            <span className={cn("tabular shrink-0 font-bold", toneClass(e.tone))}>{e.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <WhyGallaThinks reasons={card.why} uncertainty={uncertainty} />
      </div>
    </Card>
  );
}

function CustomersCard({ card }: { card: Of<"customers"> }) {
  const { navigate, dispatch } = useGalla();
  const max = Math.max(1, ...card.drivers.map((d) => d.count));
  return (
    <Card className="p-3.5">
      <p className="text-[26px] font-extrabold leading-tight text-ink">
        {card.count} <span className="align-middle text-[12px] font-extrabold tracking-wider text-bad">CUSTOMERS AT RISK</span>
      </p>
      <p className="text-[12px] text-muted">
        {card.highValue} high-value · ~{formatINRCompact(card.monthlyValue)}/month at stake
      </p>
      <ul className="mt-3 space-y-2">
        {card.drivers.map((d) => (
          <li key={d.label}>
            <div className="flex justify-between text-[12px]">
              <span className="text-ink">{d.label}</span>
              <span className="tabular font-bold">{d.count}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-canvas">
              <div className="h-full rounded-full bg-series-1" style={{ width: `${(d.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-1.5">
        {card.sample.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "SELECT_CUSTOMER", id: s.id });
                navigate("customer", { id: s.id });
              }}
              className="flex w-full items-center gap-2.5 rounded-xl bg-canvas px-2.5 py-2 text-left hover:bg-sky-50"
            >
              <Avatar name={s.name} size={30} tone="bad" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">{s.name}</span>
                <span className="line-clamp-1 block text-[11px] text-muted">{s.reason}</span>
              </span>
              <span className="shrink-0 text-[11px] font-bold text-bad">{s.lastPurchaseDaysAgo}d ago</span>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("customers", { filter: "risk" })}>
        View all {card.count} customers
      </Button>
    </Card>
  );
}

function RangeStat({ label, value, lo, hi, max }: { label: string; value: string; lo: number; hi: number; max: number }) {
  return (
    <div className="rounded-xl bg-canvas p-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-[17px] font-extrabold leading-tight text-ink">{value}</p>
      <div className="relative mt-2 h-1.5 rounded-full bg-white" aria-hidden>
        <motion.div className="absolute inset-y-0 rounded-full bg-series-1" initial={{ width: 0 }} animate={{ left: `${(lo / max) * 100}%`, width: `${Math.max(2, ((hi - lo) / max) * 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
    </div>
  );
}

export function SimulationView({ sim }: { sim: WinbackSimulation | StorewideSimulation }) {
  if (sim.type === "winback") {
    return (
      <Card className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Merchant Twin</p>
            <h4 className="text-[14px] font-bold text-ink">
              ₹{sim.offerAmount} win-back · {sim.audienceSize} customers
            </h4>
          </div>
          <SimulatedBadge />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <RangeStat label="Returning customers" value={`${sim.returnLow}–${sim.returnHigh}`} lo={sim.returnLow} hi={sim.returnHigh} max={sim.audienceSize} />
          <RangeStat label="Incremental sales" value={`${formatINRCompact(sim.salesLow)}–${formatINRCompact(sim.salesHigh)}`} lo={sim.salesLow} hi={sim.salesHigh} max={sim.audienceSize * sim.avgBasket * 0.4} />
          <div className="rounded-xl bg-canvas p-2.5">
            <p className="text-[11px] font-medium text-muted">Offer cost</p>
            <p className="mt-0.5 text-[15px] font-extrabold text-ink">
              {formatINR(sim.costLow)}–{formatINR(sim.costHigh)}
            </p>
          </div>
          <div className="rounded-xl bg-canvas p-2.5">
            <p className="text-[11px] font-medium text-muted">Estimated ROI</p>
            <p className="mt-0.5 text-[15px] font-extrabold text-good">~{sim.roi}×</p>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-muted">
          Full range {formatINR(sim.salesLow)}–{formatINR(sim.salesHigh)} · ROI = gross margin ÷ offer cost
        </p>
        <div className="mt-2">
          <WhyGallaThinks title="Assumptions" reasons={sim.assumptions} />
        </div>
      </Card>
    );
  }
  const max = sim.withSales;
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Merchant Twin · next 7 days</p>
          <h4 className="text-[14px] font-bold text-ink">₹{sim.discount} store-wide discount</h4>
        </div>
        <SimulatedBadge />
      </div>
      <div className="mt-3 space-y-2.5">
        {[
          { label: "WITHOUT DISCOUNT", value: sim.baselineSales, color: "bg-series-muted" },
          { label: `WITH ₹${sim.discount} DISCOUNT`, value: sim.withSales, color: "bg-series-1" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-[11px] font-bold tracking-wide text-muted">
              <span>{row.label}</span>
              <span className="tabular text-[13px] text-ink">{formatINR(row.value)}</span>
            </div>
            <div className="mt-1 h-3 rounded-md bg-canvas">
              <motion.div className={cn("h-full rounded-md", row.color)} initial={{ width: 0 }} animate={{ width: `${(row.value / max) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-canvas p-2">
          <p className="text-[10.5px] text-muted">Incremental sales</p>
          <p className="text-[14px] font-extrabold text-good">+{formatINR(sim.incrementalSales)}</p>
        </div>
        <div className="rounded-xl bg-canvas p-2">
          <p className="text-[10.5px] text-muted">Margin impact</p>
          <p className={cn("text-[14px] font-extrabold", sim.marginImpact < 0 ? "text-bad" : "text-good")}>{formatINR(sim.marginImpact)}</p>
        </div>
        <div className="rounded-xl bg-canvas p-2">
          <p className="text-[10.5px] text-muted">Returning</p>
          <p className="text-[14px] font-extrabold text-ink">+{sim.returning}</p>
        </div>
      </div>
      <div className="mt-2">
        <WhyGallaThinks title="Assumptions" reasons={sim.assumptions} />
      </div>
    </Card>
  );
}

export function CampaignTrackingCard({ campaignId, showDetails = true }: { campaignId: string; showDetails?: boolean }) {
  const { state, dispatch, navigate } = useGalla();
  const c = state.campaigns.find((x) => x.id === campaignId);
  if (!c) return null;
  const s = snapshotOf(c);
  const running = c.status === "running";
  const funnel: [string, number][] = [
    ["Sent", s.sent],
    ["Delivered", s.delivered],
    ["Opened", s.opened],
    ["Returned", s.returned],
  ];
  const beat = s.returned > c.expected.returnHigh;
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700">
          <Megaphone className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold text-ink">{c.name}</p>
          <p className="text-[11px] text-muted">{c.channel}</p>
        </div>
        {running ? (
          <Badge tone="info">
            <span className="size-1.5 animate-pulse rounded-full bg-sky-600" aria-hidden />
            Live · Day {Math.max(1, s.day)}/7
          </Badge>
        ) : (
          <Badge tone="good">Completed</Badge>
        )}
      </div>
      <ul className="mt-3 space-y-1.5" aria-label="Campaign funnel">
        {funnel.map(([label, v]) => (
          <li key={label} className="grid grid-cols-[70px_1fr_34px] items-center gap-2 text-[12px]">
            <span className="text-muted">{label}</span>
            <span className="h-2 rounded-full bg-canvas">
              <span className={cn("block h-full rounded-full transition-[width] duration-500", label === "Returned" ? "bg-good" : "bg-series-1")} style={{ width: `${s.sent ? (v / s.sent) * 100 : 0}%` }} />
            </span>
            <span className="tabular text-right font-bold text-ink">{v}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-canvas p-2">
          <p className="text-[10.5px] text-muted">Customers back</p>
          <p className="text-[17px] font-extrabold text-good">
            +<AnimatedNumber value={s.returned} />
          </p>
        </div>
        <div className="rounded-xl bg-canvas p-2">
          <p className="text-[10.5px] text-muted">Incremental sales</p>
          <p className="text-[15px] font-extrabold text-ink">
            <AnimatedNumber value={s.sales} format={(n) => formatINR(Math.round(n / 10) * 10)} />
          </p>
        </div>
        <div className="rounded-xl bg-canvas p-2">
          <p className="text-[10.5px] text-muted">ROI</p>
          <p className="text-[17px] font-extrabold text-ink">{s.roi ? `${s.roi}×` : "—"}</p>
        </div>
      </div>
      <p className={cn("mt-2 text-[11.5px]", beat ? "font-semibold text-good" : "text-muted")}>
        Expected {c.expected.returnLow}–{c.expected.returnHigh} customers · {formatINR(c.expected.salesLow)}–{formatINR(c.expected.salesHigh)}
        {beat && " · ahead of estimate"}
      </p>
      {(running || showDetails) && (
        <div className="mt-2.5 flex gap-2">
          {running && (
            <Button size="sm" variant="outline" icon={FastForward} onClick={() => dispatch({ type: "FAST_FORWARD", campaignId: c.id })} className="flex-1">
              Skip to day 7
            </Button>
          )}
          {showDetails && (
            <Button size="sm" variant="ghost" onClick={() => navigate("campaign", { id: c.id })} className={running ? "" : "flex-1"}>
              Campaign details
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export function CashBreakdown({ position: pos }: { position: CashPosition }) {
  const total = pos.balance + pos.expected;
  const segs = [
    { label: "Available now", value: pos.available, color: "bg-series-1", dot: "#2a78d6" },
    { label: "Committed", value: pos.committed, color: "bg-series-2", dot: "#eb6834" },
    { label: "Expected (7d)", value: pos.expected, color: "bg-series-3", dot: "#1baf7a" },
  ];
  return (
    <div>
      <div className="flex h-3.5 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={segs.map((s) => `${s.label} ${formatINR(s.value)}`).join(", ")}>
        {segs.map((s) => (
          <motion.span key={s.label} className={cn("h-full first:rounded-l-full last:rounded-r-full", s.color)} initial={{ width: 0 }} animate={{ width: `${(Math.max(0, s.value) / total) * 100}%` }} transition={{ duration: 0.8 }} />
        ))}
      </div>
      <ul className="mt-2.5 grid grid-cols-3 gap-2">
        {segs.map((s) => (
          <li key={s.label}>
            <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              <span className="size-2 rounded-sm" style={{ background: s.dot }} aria-hidden />
              {s.label}
            </span>
            <span className="tabular block text-[15px] font-extrabold text-ink">{formatINR(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CashflowCard({ position: pos }: { position: CashPosition }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Balance {formatINR(pos.balance)} · not all spendable</p>
        <Wallet className="size-4 text-sky-700" aria-hidden />
      </div>
      <div className="mt-2.5">
        <CashBreakdown position={pos} />
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted">Committed in the next 30 days</p>
      <ul className="mt-1 divide-y divide-line">
        {pos.items.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-2 py-1.5 text-[12.5px]">
            <span className="min-w-0 truncate text-ink">{o.title}</span>
            <span className="shrink-0 text-muted">in {o.dueInDays}d</span>
            <span className="tabular w-[64px] shrink-0 text-right font-bold text-ink">{formatINR(o.amount)}</span>
          </li>
        ))}
      </ul>
      {pos.pending.length > 0 && (
        <p className="mt-2 rounded-lg bg-warn-50 px-2.5 py-2 text-[12px] text-warn">
          Not counted yet: {pos.pending.map((p) => `${p.title} ${formatINR(p.amount)}`).join(", ")} — confirm to include.
        </p>
      )}
    </Card>
  );
}

export function MandateView({ prediction: m }: { prediction: MandatePrediction }) {
  const tone = m.level === "LIKELY TO FAIL" ? "bad" : m.level === "AT RISK" ? "warn" : "good";
  return (
    <Card className="p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={tone}>{m.level}</Badge>
        <SimulatedBadge label="Simulated prediction" />
      </div>
      <p className="mt-2 text-[14px] font-bold text-ink">
        {formatINR(m.amount)} {m.title} · in {m.dueInDays} days
      </p>
      <div className="mt-1 flex items-center gap-2">
        <ProgressBar value={m.probability} tone={tone === "bad" ? "bad" : tone === "warn" ? "warn" : "good"} label="Failure probability" />
        <span className="tabular shrink-0 text-[12px] font-bold text-ink">{Math.round(m.probability * 100)}%</span>
      </div>
      <ol className="mt-3 space-y-0 border-l-2 border-line pl-3 text-[12.5px]">
        <li className="relative pb-2">
          <span className="absolute -left-[17px] top-1 size-2.5 rounded-full bg-series-1" aria-hidden />
          Today · {m.account} <b className="tabular">{formatINR(m.accountBalance)}</b>
        </li>
        {m.debitsBefore.map((d) => (
          <li key={d.title} className="relative pb-2">
            <span className="absolute -left-[17px] top-1 size-2.5 rounded-full bg-series-2" aria-hidden />
            In {d.dueInDays}d · {d.title} <b className="tabular text-bad">−{formatINR(d.amount)}</b>
          </li>
        ))}
        <li className="relative pb-2">
          <span className="absolute -left-[17px] top-1 size-2.5 rounded-full bg-ink" aria-hidden />
          Before EMI · balance <b className="tabular">{formatINR(m.projectedBalance)}</b> vs needed <b className="tabular">{formatINR(m.amount)}</b>
        </li>
        {m.shortfall > 0 && (
          <li className="relative font-semibold text-bad">
            <span className="absolute -left-[17px] top-1 size-2.5 rounded-full bg-bad" aria-hidden />
            Shortfall {formatINR(m.shortfall)}
            {m.mitigated && <span className="ml-1 font-normal text-good">· reminder set</span>}
          </li>
        )}
      </ol>
      <div className="mt-2.5">
        <WhyGallaThinks reasons={m.reasons} uncertainty="Prediction from demo data. An unexpected deposit into that account would change it." />
      </div>
    </Card>
  );
}

function StockCard({ items }: { items: Of<"stock">["items"] }) {
  const { navigate } = useGalla();
  return (
    <Card className="p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Stock-out prediction</p>
      <ul className="mt-2 space-y-2.5">
        {items.map((it) => (
          <li key={it.productId}>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="min-w-0 truncate font-semibold text-ink">{it.name}</span>
              <span className={cn("shrink-0 font-bold", it.status === "out" ? "text-bad" : "text-warn")}>{it.status === "out" ? "Out of stock" : `~${it.daysLeft} days`}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-canvas">
              <div className={cn("h-full rounded-full", it.status === "out" ? "bg-bad" : "bg-series-2")} style={{ width: `${it.daysLeft ? Math.min(100, (it.daysLeft / 10) * 100) : 3}%` }} />
            </div>
            <p className="mt-0.5 text-[11px] text-muted">{it.note}</p>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" icon={Package} className="mt-3 w-full" onClick={() => navigate("inventory")}>
        Open inventory
      </Button>
    </Card>
  );
}

const LEVEL_STYLE = {
  HIGH: { bg: "bg-bad", soft: "bg-bad-50", text: "text-bad", icon: ShieldAlert },
  MEDIUM: { bg: "bg-warn", soft: "bg-warn-50", text: "text-warn", icon: ShieldQuestion },
  LOW: { bg: "bg-good", soft: "bg-good-50", text: "text-good", icon: ShieldCheck },
} as const;

export function RiskView({ assessment: a, title, subtitle, subjectKind, subjectId }: { assessment: RiskAssessment; title: string; subtitle: string; subjectKind: "qr" | "beneficiary"; subjectId: string }) {
  const [all, setAll] = useState(false);
  const st = LEVEL_STYLE[a.level];
  return (
    <Card className="overflow-hidden">
      <div className={cn("flex items-center gap-3 px-3.5 py-3 text-white", st.bg)}>
        <st.icon className="size-7 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-extrabold leading-tight">{a.level} RISK</p>
          <p className="truncate text-[12px] text-white/85">{title}</p>
        </div>
        <span className="tabular text-right text-[22px] font-extrabold leading-none">
          {a.score}
          <span className="block text-[10px] font-semibold text-white/80">/ 100</span>
        </span>
      </div>
      <div className="p-3.5">
        <p className="truncate text-[11.5px] text-muted">{subtitle}</p>
        <p className="mt-2 text-[11px] font-extrabold tracking-wider text-navy">WHY?</p>
        <ul className="mt-1 space-y-1.5">
          {a.topReasons.map((r) => (
            <li key={r.key} className="flex gap-2 text-[13px] leading-snug text-ink">
              <CircleAlert className={cn("mt-0.5 size-4 shrink-0", LEVEL_STYLE[r.level].text)} aria-hidden />
              {r.detail}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="mt-2 min-h-9 text-[12px] font-semibold text-sky-700">
          {all ? "Hide" : "Show"} all 9 signals
        </button>
        <AnimatePresence initial={false}>
          {all && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1.5 overflow-hidden">
              {a.signals.map((s) => (
                <li key={s.key} className="grid grid-cols-[1fr_60px] items-center gap-2 text-[12px]">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{s.label}</span>
                    <span className="block text-[11px] leading-snug text-muted">{s.detail}</span>
                  </span>
                  <span className="h-1.5 rounded-full bg-canvas">
                    <span className={cn("block h-full rounded-full", LEVEL_STYLE[s.level].bg)} style={{ width: `${Math.max(4, s.score * 100)}%` }} />
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <p className={cn("mt-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold", st.soft, st.text)}>{a.recommendation}</p>
        {subjectKind === "beneficiary" && <TransferGate beneficiaryId={subjectId} title={title} level={a.level} />}
        <p className="mt-2 text-[10.5px] text-faint">Scored from your own payment history (demo data). Galla does not use external fraud databases.</p>
      </div>
    </Card>
  );
}

export function TransferGate({ beneficiaryId, title, level }: { beneficiaryId: string; title: string; level: string }) {
  const { state, dispatch } = useGalla();
  const [confirming, setConfirming] = useState(false);
  const decision = state.blockedTransfers[beneficiaryId];
  if (decision) {
    return (
      <p className={cn("mt-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold", decision === "blocked" ? "bg-good-50 text-good" : "bg-warn-50 text-warn")}>
        {decision === "blocked" ? "✓ Transfer cancelled — your money is safe." : "You chose to continue. Simulated only — no payment was made."}
      </p>
    );
  }
  return (
    <div className="mt-3">
      {!confirming ? (
        <div className="flex gap-2">
          <Button variant={level === "HIGH" ? "primary" : "outline"} className="flex-1" onClick={() => dispatch({ type: "TRANSFER_DECISION", beneficiaryId, decision: "blocked", title })}>
            CANCEL
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setConfirming(true)}>
            I WANT TO CONTINUE
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-bad-50 p-3">
          <p className="text-[12.5px] font-semibold text-bad">Galla recommends not paying. Have you called the supplier on a number you already trust?</p>
          <div className="mt-2 flex gap-2">
            <Button variant="danger" size="sm" className="flex-1" onClick={() => dispatch({ type: "TRANSFER_DECISION", beneficiaryId, decision: "override", title })}>
              Yes, I verified
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirming(false)}>
              Go back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReadinessGauge({ score, level }: { score: number; level: string }) {
  const r = 52;
  const circ = Math.PI * r;
  const color = level === "READY" ? "#0b8a4c" : level === "ALMOST READY" ? "#2a78d6" : "#cf3535";
  return (
    <svg viewBox="0 0 128 76" className="w-[150px]" role="img" aria-label={`Readiness score ${score} out of 100, ${level}`}>
      <path d="M12 68 A52 52 0 0 1 116 68" fill="none" stroke="#e8edf4" strokeWidth="11" strokeLinecap="round" />
      <motion.path d="M12 68 A52 52 0 0 1 116 68" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - score / 100) }} transition={{ duration: 1, ease: "easeOut" }} />
      <text x="64" y="60" textAnchor="middle" className="fill-ink" style={{ fontSize: 26, fontWeight: 800 }}>
        {score}
      </text>
      <text x="64" y="73" textAnchor="middle" className="fill-muted" style={{ fontSize: 8.5, fontWeight: 600 }}>
        OUT OF 100
      </text>
    </svg>
  );
}

export function CreditView({ readiness: r, compact = false }: { readiness: Readiness; compact?: boolean }) {
  const tone = r.level === "READY" ? "good" : r.level === "ALMOST READY" ? "info" : "bad";
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-3">
        <ReadinessGauge score={r.score} level={r.level} />
        <div className="min-w-0">
          <Badge tone={tone} icon={Landmark}>
            {r.level}
          </Badge>
          <p className="mt-1.5 text-[12px] leading-snug text-muted">Readiness to apply for credit. Galla doesn&apos;t approve loans — lenders decide.</p>
        </div>
      </div>
      {!compact && (
        <ul className="mt-3 space-y-2">
          {r.factors.map((f) => (
            <li key={f.key}>
              <div className="flex justify-between gap-2 text-[12.5px]">
                <span className="font-semibold text-ink">{f.label}</span>
                <span className={cn("tabular font-bold", f.score >= 80 ? "text-good" : f.score >= 60 ? "text-ink" : "text-bad")}>{f.score}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-canvas">
                <div className="h-full rounded-full bg-series-1" style={{ width: `${f.score}%` }} />
              </div>
              <p className="mt-0.5 text-[11px] text-muted">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {r.improvements.length > 0 && (
        <p className="mt-3 rounded-lg bg-sky-50 px-2.5 py-2 text-[12.5px] text-sky-700">
          <b>To improve:</b> {r.improvements.join(" · ")}
        </p>
      )}
    </Card>
  );
}

const confTone = (c: number) => (c >= 0.9 ? "text-good bg-good-50" : c >= 0.82 ? "text-warn bg-warn-50" : "text-bad bg-bad-50");

export function ExtractionView({ fields, lineItems, inconsistencies }: { fields: ExtractedField[]; lineItems?: InvoiceLine[]; inconsistencies: string[] }) {
  return (
    <div>
      <dl className="divide-y divide-line">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2 py-1.5 text-[12.5px]">
            <dt className="text-muted">{f.label}</dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-right font-semibold text-ink">
              <span className="truncate">{f.value}</span>
              <span className={cn("tabular shrink-0 rounded px-1 text-[10px] font-bold", confTone(f.confidence))}>{Math.round(f.confidence * 100)}%</span>
            </dd>
          </div>
        ))}
      </dl>
      {lineItems && lineItems.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-lg ring-1 ring-line">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-canvas text-muted">
              <tr>
                <th scope="col" className="px-2 py-1.5 font-semibold">Item</th>
                <th scope="col" className="px-2 py-1.5 text-right font-semibold">Qty</th>
                <th scope="col" className="px-2 py-1.5 text-right font-semibold">Price</th>
                <th scope="col" className="px-2 py-1.5 text-right font-semibold">Conf.</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {lineItems.map((l) => (
                <tr key={l.name} className="border-t border-line">
                  <td className="px-2 py-1.5 text-ink">{l.name}</td>
                  <td className="px-2 py-1.5 text-right">{l.quantity}</td>
                  <td className="px-2 py-1.5 text-right">₹{l.unitPrice}</td>
                  <td className="px-2 py-1.5 text-right">
                    <span className={cn("rounded px-1 text-[10px] font-bold", confTone(l.confidence))}>{Math.round(l.confidence * 100)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {inconsistencies.map((i) => (
        <p key={i} className="mt-2 flex gap-1.5 rounded-lg bg-warn-50 px-2.5 py-2 text-[12px] text-warn">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {i}
        </p>
      ))}
    </div>
  );
}

function InvoiceView({ documentId }: { documentId: string }) {
  const doc = SAMPLE_DOCUMENTS.find((d) => d.id === documentId);
  if (!doc) return null;
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Invoice intelligence</p>
          <p className="truncate text-[14px] font-bold text-ink">{doc.title}</p>
        </div>
        <Badge tone="info">Extracted</Badge>
      </div>
      <div className="mt-2">
        <ExtractionView fields={doc.fields} lineItems={doc.lineItems} inconsistencies={doc.inconsistencies} />
      </div>
    </Card>
  );
}

const CATEGORY_STYLE: Record<string, string> = {
  "Biscuits & Snacks": "from-[#ffe7d6] to-[#ffd2b3] text-[#9a4a17]",
  Staples: "from-[#fff1cc] to-[#ffe199] text-[#8a5a00]",
  "Dairy & Bakery": "from-[#e3f2ff] to-[#c9e4ff] text-[#1c5cab]",
  Beverages: "from-[#dcf6ec] to-[#bdeedb] text-[#146b4b]",
  "Home & Personal Care": "from-[#efe9ff] to-[#ddd3ff] text-[#4a3aa7]",
  "Ready to Cook": "from-[#ffe3e3] to-[#ffc9c9] text-[#a33a3a]",
};

export function CategoryTile({ name, category, size = 44 }: { name: string; category: string; size?: number }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-extrabold", CATEGORY_STYLE[category] ?? "from-canvas to-line text-muted")} style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {name
        .replace(/[^A-Za-z ]/g, "")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

function CatalogPreviewCard({ item }: { item: Of<"catalog">["item"] }) {
  const { navigate } = useGalla();
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <CategoryTile name={item.name} category={item.category} size={52} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Catalog preview</p>
        <p className="truncate text-[15px] font-bold text-ink">{item.name}</p>
        <p className="text-[13px] text-ink">
          <b>₹{item.price}</b> · Stock: {item.stock}
        </p>
      </div>
      <Button size="sm" variant="ghost" icon={Store} onClick={() => navigate("catalog")} aria-label="Open catalog" />
    </Card>
  );
}

function ObligationCard({ card }: { card: Of<"obligation"> }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Promised-away money</p>
        {card.recurring && <Badge tone="info">Monthly</Badge>}
      </div>
      <p className="mt-1 text-[15px] font-bold text-ink">{card.title}</p>
      <p className="text-[22px] font-extrabold text-ink">{formatINR(card.amount)}</p>
      <p className="text-[12.5px] text-muted">{card.dueLabel}</p>
      {card.note && <p className="mt-2 rounded-lg bg-canvas px-2.5 py-2 text-[12px] text-muted">{card.note}</p>}
    </Card>
  );
}

const CAPABILITIES = [
  { label: "Growth", prompt: "Nanna sales ee vaara yaake kadime aagide?", icon: TrendingUp },
  { label: "Inventory", prompt: "Stock yaavaga mugiyutte?", icon: Boxes },
  { label: "Cashflow", prompt: "Nijavaagi eshtu hana available ide?", icon: Wallet },
  { label: "Safety", prompt: "Ee QR safe aa?", icon: ShieldCheck },
  { label: "Credit", prompt: "Loan-ge ready iddina?", icon: Landmark },
  { label: "Catalog", prompt: "Ee biscuit packet ₹10, 25 pieces ide.", icon: Store },
];

function CapabilitiesCard() {
  const { sendMessage, busy } = useGalla();
  return (
    <div className="grid grid-cols-2 gap-2">
      {CAPABILITIES.map((c) => (
        <button key={c.label} type="button" disabled={busy} onClick={() => sendMessage(c.prompt)} className="flex min-h-16 flex-col items-start gap-1 rounded-2xl bg-white p-3 text-left shadow-card hover:ring-2 hover:ring-sky/40">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-navy">
            <c.icon className="size-4 text-sky-700" aria-hidden />
            {c.label}
          </span>
          <span className="text-[11.5px] leading-snug text-muted">“{c.prompt}”</span>
        </button>
      ))}
    </div>
  );
}

function CtaRow({ buttons }: { buttons: Of<"cta">["buttons"] }) {
  const { sendMessage, navigate, busy } = useGalla();
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b, i) => (
        <Button
          key={b.label}
          size="sm"
          variant={i === 0 ? "primary" : "outline"}
          icon={i === 0 ? ArrowRight : undefined}
          disabled={busy && !!b.prompt}
          onClick={() => (b.prompt ? sendMessage(b.prompt) : b.route && navigate(b.route as Parameters<typeof navigate>[0]))}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}

export { ConfidencePill };
