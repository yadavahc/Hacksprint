"use client";

import { BookOpen, FileText, FlaskConical, History, Landmark, Megaphone, Package, Sparkles, Store, TrendingUp, Users, Wallet } from "lucide-react";
import { useMemo } from "react";
import { AskGallaBar, ScreenHeader } from "@/components/app-shell/shell-bits";
import { GallaMark } from "@/components/ui/ai-bits";
import { Button, Card, ListRow, Stat } from "@/components/ui/primitives";
import { cashPosition } from "@/lib/cashflow/cashflow";
import { computeReadiness } from "@/lib/credit/readiness";
import { customerStats } from "@/lib/data/customers";
import { formatINR, formatNumber } from "@/lib/data/format";
import { pctChange, STORY } from "@/lib/data/story";
import { inventoryHealth } from "@/lib/inventory/inventory";
import { useGalla } from "@/lib/store/provider";
import { agentContext, currentCustomers } from "@/lib/store/selectors";

export function BusinessScreen() {
  const { state, navigate, sendMessage, busy } = useGalla();
  const customers = currentCustomers(state);
  const stats = useMemo(() => customerStats(customers), [customers]);
  const pos = useMemo(() => cashPosition(state.obligations, state.patterns), [state.obligations, state.patterns]);
  const inv = useMemo(() => inventoryHealth(state.products), [state.products]);
  const ctx = agentContext(state);
  const readiness = computeReadiness({ documentIds: ctx.documentIds, campaignCompleted: ctx.campaigns.some((c) => c.status === "completed") });
  const running = state.campaigns.find((c) => !c.seeded && c.status === "running");

  return (
    <div className="pb-2">
      <ScreenHeader title="Business" subtitle="Last 30 days · Shree Lakshmi Stores" back={false} />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="col-span-2 p-4">
            <Stat label="Revenue · 30 days" value={formatINR(STORY.last30Revenue)} delta={`+${pctChange(STORY.last30Revenue, STORY.prev30Revenue).toFixed(1)}%`} tone="up" sub="vs previous 30 days" />
          </Card>
          <Card className="p-3.5">
            <Stat label="Transactions" value={formatNumber(STORY.last30Txns)} delta={`+${pctChange(STORY.last30Txns, STORY.prev30Txns).toFixed(1)}%`} tone="up" />
          </Card>
          <Card className="p-3.5">
            <Stat label="Customers" value={formatNumber(stats.total)} sub={`${stats.atRisk} at risk`} />
          </Card>
          <Card className="p-3.5">
            <Stat label="Inventory health" value={`${inv.pct}%`} sub={`${inv.risk.length} running low`} />
          </Card>
          <Card className="p-3.5">
            <Stat label="Cash available" value={formatINR(pos.available)} sub={`${formatINR(pos.committed)} committed`} />
          </Card>
        </div>

        <Card className="border-l-4 border-sky p-4">
          <div className="flex items-center gap-2">
            <GallaMark size={22} />
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-navy">GALLA PRIORITY</span>
          </div>
          <p className="mt-2 text-[15.5px] font-bold leading-snug text-ink">Your repeat customer activity is falling.</p>
          <p className="mt-1 text-[12.5px] text-muted">
            Repeat customers {pctChange(STORY.repeatCustomersNow, STORY.repeatCustomersBefore).toFixed(1)}% · {stats.atRisk} regulars inactive 14+ days
          </p>
          <Button className="mt-3" size="sm" icon={Sparkles} onClick={() => sendMessage("Nanna sales ee vaara yaake kadime aagide?")} disabled={busy}>
            Ask Galla why
          </Button>
        </Card>

        <AskGallaBar placeholder="Ask about sales, stock, cash…" />

        <Card as="section" aria-label="Business tools" className="divide-y divide-line overflow-hidden">
          <ListRow icon={BookOpen} title="Udhaar Khata" subtitle="Voice khata · AI recovery calls · trust scores" onClick={() => navigate("udhaar")} tone="warn" />
          <ListRow icon={TrendingUp} title="Sales" subtitle={`${formatINR(STORY.last7Revenue)} this week · −11% vs normal`} onClick={() => navigate("sales")} />
          <ListRow icon={Users} title="Customers" subtitle={`${stats.atRisk} at risk · ${stats.highValue} high-value`} onClick={() => navigate("customers")} tone={stats.atRisk ? "bad" : "info"} />
          <ListRow icon={Package} title="Inventory & procurement" subtitle={`${inv.pct}% healthy · ${inv.risk.length} low · ${inv.out.length} out`} onClick={() => navigate("inventory")} tone={inv.risk.length ? "warn" : "info"} />
          <ListRow icon={Wallet} title="Cashflow guardian" subtitle={`${formatINR(pos.available)} truly available`} onClick={() => navigate("cashflow")} />
          <ListRow icon={Megaphone} title="Campaigns" subtitle={running ? "1 campaign live" : `${state.campaigns.length} campaign${state.campaigns.length === 1 ? "" : "s"}`} onClick={() => navigate("campaigns")} />
          <ListRow icon={FlaskConical} title="Merchant Twin" subtitle="What-if simulator for offers & discounts" onClick={() => navigate("whatif")} />
          <ListRow icon={Landmark} title="Credit readiness" subtitle={`${readiness.level} · ${readiness.score}/100`} onClick={() => navigate("credit")} />
          <ListRow icon={FileText} title="Documents" subtitle={`${state.documents.length} on file`} onClick={() => navigate("documents")} />
          <ListRow icon={Store} title="Digital catalog" subtitle={`${state.catalog.filter((c) => c.published).length} items live`} onClick={() => navigate("catalog")} />
          <ListRow icon={History} title="Action history" subtitle={`${state.audit.length} actions · ${state.learnings.length} learnings`} onClick={() => navigate("history")} />
        </Card>
      </div>
    </div>
  );
}
