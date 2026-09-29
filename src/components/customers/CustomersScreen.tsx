"use client";

import { Search, Sparkles, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { Avatar } from "@/components/ui/animated-number";
import { WhyGallaThinks } from "@/components/ui/ai-bits";
import { ChartCard } from "@/components/ui/chart-card";
import { Badge, Button, Card, ProgressBar, Segmented, Stat, cn } from "@/components/ui/primitives";
import { customerStats, isAtRisk } from "@/lib/data/customers";
import { daysAgoLabel, formatINR, formatINRCompact, formatNumber } from "@/lib/data/format";
import { SEED_PRODUCTS } from "@/lib/data/products";
import type { Customer } from "@/lib/data/types";
import { useGalla } from "@/lib/store/provider";
import { currentCustomers, returnedCustomerIds } from "@/lib/store/selectors";

type Filter = "risk" | "high" | "all";

export function CustomersScreen() {
  const { state, navigate, dispatch, sendMessage, busy } = useGalla();
  const customers = currentCustomers(state);
  const stats = useMemo(() => customerStats(customers), [customers]);
  const initial = state.route.params?.filter;
  const [filter, setFilter] = useState<Filter>(initial === "high" || initial === "all" ? initial : "risk");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(25);

  const segments = useMemo(
    () => (["regular", "occasional", "new", "lapsed"] as const).map((s) => ({ segment: s, count: customers.filter((c) => c.segment === s).length })),
    [customers],
  );
  const segMax = Math.max(...segments.map((s) => s.count));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => (filter === "risk" ? isAtRisk(c) : filter === "high" ? c.highValue : true))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (filter === "risk" ? b.churnProbability - a.churnProbability : b.totalSpend - a.totalSpend));
  }, [customers, filter, query]);

  const open = (c: Customer) => {
    dispatch({ type: "SELECT_CUSTOMER", id: c.id });
    navigate("customer", { id: c.id });
  };

  return (
    <div className="pb-2">
      <ScreenHeader title="Customers" subtitle="Customer intelligence · last 90 days" />
      <div className="space-y-3.5 px-4 pt-2">
        <Card className="grid grid-cols-3 gap-x-2 gap-y-3 p-4">
          <Stat label="Total" value={formatNumber(stats.total)} />
          <Stat label="Active" value={formatNumber(stats.active)} sub="30 days" />
          <Stat label="Inactive" value={formatNumber(stats.inactive)} />
          <Stat label="High-value" value={String(stats.highValue)} />
          <Stat label="Churn risk" value={String(stats.atRisk)} tone="down" delta="regulars" />
          <Stat label="New" value={String(stats.newThisMonth)} sub="this month" />
        </Card>

        {stats.atRisk > 0 && (
          <Card className="overflow-hidden">
            <div className="bg-bad-50 px-4 py-3">
              <p className="text-[22px] font-extrabold text-bad">{stats.atRisk} CUSTOMERS AT RISK</p>
              <p className="text-[12.5px] text-ink">
                Regulars with no purchase in 14+ days · ~{formatINRCompact(stats.monthlyValueAtRisk)}/month
              </p>
            </div>
            <div className="flex gap-2 p-3">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setFilter("risk")}>
                VIEW CUSTOMERS
              </Button>
              <Button size="sm" className="flex-1" icon={Sparkles} disabled={busy} onClick={() => sendMessage("₹50 offer kotre enagutte?")}>
                Win them back
              </Button>
            </div>
          </Card>
        )}

        <ChartCard title="Customer segments" subtitle="Based on purchase frequency" table={{ columns: ["Segment", "Customers"], rows: segments.map((s) => [s.segment, s.count]) }}>
          <ul className="space-y-2">
            {segments.map((s) => (
              <li key={s.segment} className="grid grid-cols-[82px_1fr_36px] items-center gap-2 text-[12.5px]">
                <span className="capitalize text-muted">{s.segment}</span>
                <span className="h-3 rounded bg-canvas">
                  <span className="block h-full rounded bg-series-1" style={{ width: `${(s.count / segMax) * 100}%` }} />
                </span>
                <span className="tabular text-right font-bold text-ink">{s.count}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <div className="space-y-2">
          <Segmented
            label="Filter customers"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setLimit(25);
            }}
            options={[
              { value: "risk", label: `At risk (${stats.atRisk})` },
              { value: "high", label: "High-value" },
              { value: "all", label: "All" },
            ]}
          />
          <label className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-card">
            <Search className="size-4 text-faint" aria-hidden />
            <span className="sr-only">Search customers</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint" />
          </label>
        </div>

        <Card className="divide-y divide-line overflow-hidden">
          {list.length === 0 && <p className="p-5 text-center text-[13px] text-muted">{filter === "risk" ? "No regular customers are at risk right now." : "No customers match your search."}</p>}
          {list.slice(0, limit).map((c) => (
            <button key={c.id} type="button" onClick={() => open(c)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas/60">
              <Avatar name={c.name} size={36} tone={isAtRisk(c) ? "bad" : c.highValue ? "navy" : "sky"} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
                <span className="block truncate text-[11.5px] capitalize text-muted">
                  {c.segment}
                  {c.highValue ? " · high-value" : ""} · {daysAgoLabel(c.lastPurchaseDaysAgo)}
                </span>
              </span>
              {filter === "risk" ? (
                <span className="tabular shrink-0 rounded-lg bg-bad-50 px-2 py-1 text-[11.5px] font-bold text-bad">{Math.round(c.churnProbability * 100)}%</span>
              ) : (
                <span className="tabular shrink-0 text-[12.5px] font-bold text-ink">{formatINRCompact(c.totalSpend)}</span>
              )}
            </button>
          ))}
          {limit < list.length && (
            <button type="button" onClick={() => setLimit((l) => l + 25)} className="min-h-11 w-full text-[13px] font-semibold text-sky-700">
              Show more ({list.length - limit} more)
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

export function CustomerDetailScreen() {
  const { state, navigate, sendMessage, busy } = useGalla();
  const customers = currentCustomers(state);
  const id = state.route.params?.id ?? state.selectedCustomerId;
  const c = customers.find((x) => x.id === id);

  if (!c) {
    return (
      <div>
        <ScreenHeader title="Customer" parent="customers" />
        <Card className="m-4 p-5 text-center">
          <UserRound className="mx-auto size-8 text-faint" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-ink">Customer not found</p>
          <Button className="mt-3" size="sm" onClick={() => navigate("customers")}>
            All customers
          </Button>
        </Card>
      </div>
    );
  }

  const risk = isAtRisk(c);
  const returned = returnedCustomerIds(state).includes(c.id);
  const running = state.campaigns.some((x) => !x.seeded && x.status === "running");
  const level = c.churnProbability >= 0.5 ? "High" : c.churnProbability >= 0.25 ? "Medium" : "Low";
  const favs = c.favoriteProductIds.map((pid) => SEED_PRODUCTS.find((p) => p.id === pid)?.name).filter(Boolean);

  return (
    <div className="pb-2">
      <ScreenHeader title={c.name} subtitle="Customer detail" parent="customers" />
      <div className="space-y-3.5 px-4 pt-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={c.name} size={52} tone={risk ? "bad" : "navy"} />
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold text-ink">{c.name}</p>
              <p className="text-[12px] text-muted">
                {c.vpa} · {c.phone}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge tone="info">{c.segment}</Badge>
                {c.highValue && <Badge tone="navy">High-value</Badge>}
                {risk && <Badge tone="bad">At risk</Badge>}
                {returned && <Badge tone="good">Returned</Badge>}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 border-t border-line pt-3">
            <Stat label="Last purchase" value={daysAgoLabel(c.lastPurchaseDaysAgo)} />
            <Stat label="Total spend" value={formatINRCompact(c.totalSpend)} />
            <Stat label="Avg basket" value={formatINR(c.avgBasket)} />
            <Stat label="Visits (90d)" value={String(c.visitsLast90)} />
            <Stat label="Buys every" value={`${c.purchaseEveryDays} days`} />
            <Stat label="Shops in" value={c.preferredTime} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Churn probability</p>
            <span className={cn("text-[15px] font-extrabold", level === "High" ? "text-bad" : level === "Medium" ? "text-warn" : "text-good")}>
              {Math.round(c.churnProbability * 100)}% · {level}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={c.churnProbability} tone={level === "High" ? "bad" : level === "Medium" ? "warn" : "good"} label="Churn probability" />
          </div>
          {c.riskReason && (
            <div className="mt-3">
              <WhyGallaThinks title="Reason for risk" defaultOpen reasons={[c.riskReason]} uncertainty="Estimated from payment gaps only — Galla can't see visits without a payment." />
            </div>
          )}
          {returned && <p className="mt-3 rounded-xl bg-good-50 px-3 py-2 text-[13px] font-semibold text-good">Came back after your win-back campaign.</p>}
        </Card>

        {favs.length > 0 && (
          <Card className="p-4">
            <p className="text-sm font-bold text-ink">Usually buys</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {favs.map((f) => (
                <span key={f} className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-medium text-ink">
                  {f}
                </span>
              ))}
            </div>
          </Card>
        )}

        {risk && !running && (
          <Button className="w-full" icon={Sparkles} disabled={busy} onClick={() => sendMessage("₹50 offer kotre enagutte?")}>
            Win back with a ₹50 offer
          </Button>
        )}
        <Button className="w-full" variant="outline" disabled={busy} onClick={() => sendMessage("Yaaru aa 47 customers?")}>
          Ask Galla about at-risk customers
        </Button>
      </div>
    </div>
  );
}
