"use client";

import { FileText, GraduationCap, Landmark, Megaphone, Package, QrCode, ShieldAlert, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useMemo } from "react";
import { AskGallaBar } from "@/components/app-shell/shell-bits";
import { CashBreakdown } from "@/components/chat/cards";
import { GallaMark } from "@/components/ui/ai-bits";
import { Badge, Button, Card, Stat } from "@/components/ui/primitives";
import { cashPosition } from "@/lib/cashflow/cashflow";
import { customerStats } from "@/lib/data/customers";
import { formatINR, formatINRCompact, greeting } from "@/lib/data/format";
import { MERCHANT, STORY } from "@/lib/data/story";
import { daysRemaining, inventoryHealth } from "@/lib/inventory/inventory";
import { reorderProposal } from "@/lib/store/proposals";
import { useGalla } from "@/lib/store/provider";
import { currentCustomers, snapshotOf } from "@/lib/store/selectors";

export function HomeScreen() {
  const { state, sendMessage, navigate, busy, setSheet } = useGalla();
  const customers = currentCustomers(state);
  const stats = useMemo(() => customerStats(customers), [customers]);
  const pos = useMemo(() => cashPosition(state.obligations, state.patterns), [state.obligations, state.patterns]);
  const inv = useMemo(() => inventoryHealth(state.products), [state.products]);
  const nextRisk = [...inv.risk].sort((a, b) => daysRemaining(a) - daysRemaining(b))[0];
  const running = state.campaigns.find((c) => !c.seeded && c.status === "running");
  const done = state.campaigns.find((c) => !c.seeded && c.status === "completed");
  const karthik = state.blockedTransfers["b-karthik"];
  // Payments collected in this session (verified with Paytm staging, or clearly simulated) count toward today.
  const collected = state.payments.filter((p) => p.status === "TXN_SUCCESS");
  const collectedTotal = collected.reduce((s, p) => s + p.amount, 0);
  const todaySales = STORY.todaySales + collectedTotal;
  const todayTxns = STORY.todayTxns + collected.length;
  const todayUpi = STORY.todayUpi + collectedTotal;

  return (
    <div className="space-y-3.5 px-4 pb-2 pt-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-medium text-muted">
            {greeting()}, {MERCHANT.owner}
          </p>
          <h1 className="text-[21px] font-extrabold leading-tight text-ink">Your business today</h1>
        </div>
        <Badge tone="neutral">Demo data</Badge>
      </div>

      <AskGallaBar />

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Today&apos;s sales · till now</p>
            <p className="mt-0.5 text-[28px] font-extrabold leading-tight text-ink">{formatINR(todaySales)}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate("sales")}>
            Sales
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3">
          <Stat label="Transactions" value={String(todayTxns)} sub={collected.length ? `+${collected.length} via QR` : undefined} />
          <Stat label="Avg. transaction value" value={formatINR(todaySales / todayTxns)} />
          <Stat label="UPI received" value={formatINR(todayUpi)} sub={`${Math.round((todayUpi / todaySales) * 100)}% of sales`} />
          <Stat label="Cash" value={formatINR(STORY.todayCash)} sub={`${Math.round((STORY.todayCash / todaySales) * 100)}% of sales`} />
        </div>
      </Card>

      <section aria-label="AI priority" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy-900 p-4 text-white shadow-float">
        <span aria-hidden className="absolute -right-10 -top-10 size-36 rounded-full bg-sky/25 blur-2xl" />
        <div className="relative flex items-center gap-2">
          <GallaMark size={24} />
          <span className="text-[11px] font-extrabold tracking-[0.16em] text-sky">AI PRIORITY</span>
        </div>
        {running ? (
          <div className="relative">
            <p className="mt-2 text-[17px] font-bold leading-snug">Your win-back campaign is live.</p>
            <p className="mt-1 text-[12.5px] text-white/75">
              {snapshotOf(running).returned} of {running.audienceSize} customers back · {formatINR(snapshotOf(running).sales)} in sales so far
            </p>
            <Button variant="sky" className="mt-3" icon={Megaphone} onClick={() => navigate("campaign", { id: running.id })}>
              TRACK
            </Button>
          </div>
        ) : done ? (
          <div className="relative">
            <p className="mt-2 text-[17px] font-bold leading-snug">
              {snapshotOf(done).returned} customers came back · ROI {snapshotOf(done).roi}×
            </p>
            <p className="mt-1 text-[12.5px] text-white/75">
              {stats.atRisk} regulars still inactive · Galla learned from the campaign
            </p>
            <Button variant="sky" className="mt-3" icon={GraduationCap} onClick={() => navigate("history")}>
              SEE WHAT GALLA LEARNED
            </Button>
          </div>
        ) : (
          <div className="relative">
            <p className="mt-2 text-[17px] font-bold leading-snug">{stats.atRisk} regular customers haven&apos;t purchased in 14 days.</p>
            <p className="mt-1 text-[12.5px] text-white/75">~{formatINRCompact(stats.monthlyValueAtRisk)} a month at stake · sales down 11% this week</p>
            <Button variant="sky" className="mt-3" icon={Sparkles} onClick={() => sendMessage("Nanna sales ee vaara yaake kadime aagide?")} disabled={busy}>
              FIX THIS
            </Button>
          </div>
        )}
      </section>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">Cash position</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate("cashflow")}>
            Details
          </Button>
        </div>
        <CashBreakdown position={pos} />
        <ul className="mt-3 space-y-1 border-t border-line pt-2.5">
          {pos.items.slice(0, 2).map((o) => (
            <li key={o.id} className="flex justify-between gap-2 text-[12.5px]">
              <span className="truncate text-ink">{o.title}</span>
              <span className="tabular shrink-0 text-muted">
                in {o.dueInDays}d · <b className="text-ink">{formatINR(o.amount)}</b>
              </span>
            </li>
          ))}
        </ul>
        <button type="button" disabled={busy} onClick={() => sendMessage("Nijavaagi eshtu hana available ide?")} className="mt-2 min-h-9 text-[12.5px] font-semibold text-sky-700">
          Ask Galla: “Nijavaagi eshtu hana available ide?”
        </button>
      </Card>

      {nextRisk && (
        <Card className="flex items-center gap-3 p-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn-50 text-warn">
            <Package className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-warn">Inventory alert</p>
            <p className="text-[13.5px] font-semibold leading-snug text-ink">
              {nextRisk.name} may run out in {Math.round(daysRemaining(nextRisk))} days.
            </p>
            {inv.out.length > 0 && <p className="text-[11.5px] text-muted">{inv.out.map((p) => p.name).join(", ")} out of stock</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => setSheet({ type: "confirm", proposal: reorderProposal(nextRisk) })}>
            Reorder
          </Button>
        </Card>
      )}

      <Card className="flex items-center gap-3 p-3.5">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${karthik === "blocked" ? "bg-good-50 text-good" : "bg-bad-50 text-bad"}`}>
          {karthik === "blocked" ? <ShieldCheck className="size-5" aria-hidden /> : <ShieldAlert className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[10.5px] font-bold uppercase tracking-wider ${karthik === "blocked" ? "text-good" : "text-bad"}`}>Safety alert</p>
          <p className="text-[13.5px] font-semibold leading-snug text-ink">{karthik === "blocked" ? "Suspicious transfer cancelled." : "This beneficiary looks unusual."}</p>
          <p className="text-[11.5px] text-muted">Karthik Enterprises · ₹35,700 request</p>
        </div>
        <Button size="sm" variant={karthik ? "ghost" : "primary"} onClick={() => navigate("beneficiary")}>
          {karthik ? "View" : "Check"}
        </Button>
      </Card>

      <Card className="grid grid-cols-4 gap-1 p-2">
        {[
          { label: "Receive", icon: QrCode, screen: "qr" as const },
          { label: "Catalog", icon: Store, screen: "catalog" as const },
          { label: "Documents", icon: FileText, screen: "documents" as const },
          { label: "Credit", icon: Landmark, screen: "credit" as const },
        ].map((a) => (
          <button key={a.label} type="button" onClick={() => navigate(a.screen)} className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl text-[11.5px] font-semibold text-ink hover:bg-canvas">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-navy">
              <a.icon className="size-5" aria-hidden />
            </span>
            {a.label}
          </button>
        ))}
      </Card>
    </div>
  );
}
