"use client";

import { ChevronDown, FileText, Package, Share2, Sparkles, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { GallaMark } from "@/components/ui/ai-bits";
import { ChartCard } from "@/components/ui/chart-card";
import { Badge, Button, Card, ProgressBar, Segmented, cn } from "@/components/ui/primitives";
import { formatINR, shortDate } from "@/lib/data/format";
import { SUPPLIERS } from "@/lib/data/products";
import { STORY } from "@/lib/data/story";
import { daysRemaining, inventoryHealth, reorderSuggestion, stockoutDate, stockStatus } from "@/lib/inventory/inventory";
import { reorderProposal } from "@/lib/store/proposals";
import { useGalla } from "@/lib/store/provider";

type Filter = "all" | "low" | "out";

export function InventoryScreen() {
  const { state, setSheet, sendMessage, busy, dispatch } = useGalla();
  const inv = useMemo(() => inventoryHealth(state.products), [state.products]);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const risk = [...inv.risk].sort((a, b) => daysRemaining(a) - daysRemaining(b));
  const lead = risk[0];
  const suggestion = lead ? reorderSuggestion(lead) : null;

  const lowest = state.products
    .filter((p) => !p.dailyReplenished && p.stock > 0)
    .map((p) => ({ name: p.name, days: Math.round(daysRemaining(p) * 10) / 10 }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);

  const list = state.products
    .filter((p) => (filter === "low" ? stockStatus(p) === "risk" : filter === "out" ? stockStatus(p) === "out" : true))
    .sort((a, b) => daysRemaining(a) - daysRemaining(b));

  return (
    <div className="pb-2">
      <ScreenHeader title="Inventory" subtitle={`${state.products.length} products · ${SUPPLIERS.length} suppliers`} />
      <div className="space-y-3.5 px-4 pt-2">
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Inventory health</p>
              <p className="text-[30px] font-extrabold leading-tight text-ink">{inv.pct}%</p>
            </div>
            <div className="flex gap-3 text-right text-[12px]">
              <span>
                <b className="block text-[16px] text-good">{inv.healthy}</b>healthy
              </span>
              <span>
                <b className="block text-[16px] text-warn">{inv.risk.length}</b>low
              </span>
              <span>
                <b className="block text-[16px] text-bad">{inv.out.length}</b>out
              </span>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar value={inv.pct / 100} tone="good" label="Inventory health" />
          </div>
        </Card>

        {lead && suggestion && (
          <Card className="border-l-4 border-warn p-4">
            <div className="flex items-center gap-2">
              <GallaMark size={22} />
              <span className="text-[11px] font-extrabold tracking-[0.14em] text-navy">GALLA PREDICTS</span>
            </div>
            <p className="mt-2 text-[15px] font-bold leading-snug text-ink">
              {lead.category === "Biscuits & Snacks" ? "Biscuit" : lead.name} stock will likely finish in {Math.max(1, Math.round(suggestion.daysLeft))} days.
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
              <dt className="text-muted">Recommended quantity</dt>
              <dd className="text-right font-bold text-ink">
                {suggestion.quantity} ({suggestion.cases} case{suggestion.cases > 1 ? "s" : ""})
              </dd>
              <dt className="text-muted">Supplier</dt>
              <dd className="truncate text-right font-bold text-ink">{suggestion.supplierName}</dd>
              <dt className="text-muted">Estimated cost</dt>
              <dd className="text-right font-bold text-ink">{formatINR(suggestion.cost)}</dd>
              <dt className="text-muted">Expected stock-out</dt>
              <dd className="text-right font-bold text-bad">{stockoutDate(lead) ? shortDate(stockoutDate(lead)!) : "—"}</dd>
            </dl>
            <Button className="mt-3 w-full" icon={Truck} onClick={() => setSheet({ type: "confirm", proposal: reorderProposal(lead), confirmLabel: "APPROVE ORDER" })}>
              REORDER
            </Button>
          </Card>
        )}

        {inv.out.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bad-50 text-bad">
              <Package className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-ink">{p.name} is out of stock</p>
              <p className="text-[11.5px] text-muted">{p.id === STORY.outOfStockProductId ? `For ${p.outOfStockDays ?? 3} days · 14 regular customers buy this` : "Reorder soon"}</p>
            </div>
            <Button size="sm" variant="outline" icon={FileText} disabled={busy} onClick={() => sendMessage("Invoice inda stock update maadu.")}>
              Invoice
            </Button>
          </Card>
        ))}

        <ChartCard title="Days of stock left" subtitle="Lowest 8 products · red zone is 5 days or less" table={{ columns: ["Product", "Days left"], rows: lowest.map((l) => [l.name, l.days]) }}>
          <ul className="relative space-y-2">
            <span aria-hidden className="absolute bottom-0 top-0 w-px bg-bad/50" style={{ left: `calc(112px + (100% - 150px) * ${5 / 20})` }} />
            {lowest.map((l) => (
              <li key={l.name} className="grid grid-cols-[104px_1fr_34px] items-center gap-2 text-[12px]">
                <span className="truncate text-muted">{l.name}</span>
                <span className="h-3 rounded bg-canvas">
                  <span className={cn("block h-full rounded", l.days <= 5 ? "bg-series-2" : "bg-series-1")} style={{ width: `${Math.min(100, (l.days / 20) * 100)}%` }} />
                </span>
                <span className="tabular text-right font-bold text-ink">{l.days}d</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        {state.supplierOrders.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-ink">Supplier orders</h3>
            <ul className="mt-2 space-y-2.5">
              {state.supplierOrders.map((o) => (
                <li key={o.id} className="rounded-xl bg-canvas p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-ink">{o.supplierName}</p>
                    <Badge tone={o.status === "Ready to send" ? "warn" : "good"}>{o.status}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{o.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink">{formatINR(o.total)}</span>
                    {o.status === "Ready to send" && (
                      <Button size="sm" variant="outline" icon={Share2} onClick={() => dispatch({ type: "SHARE_ORDER", id: o.id })}>
                        Share with supplier
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Segmented
          label="Filter products"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "low", label: `Low (${inv.risk.length})` },
            { value: "out", label: `Out (${inv.out.length})` },
          ]}
        />

        <Card className="divide-y divide-line overflow-hidden">
          {list.length === 0 && <p className="p-5 text-center text-[13px] text-muted">Nothing here — stock looks good.</p>}
          {list.map((p) => {
            const st = stockStatus(p);
            const s = reorderSuggestion(p);
            const open = openId === p.id;
            const d = daysRemaining(p);
            return (
              <div key={p.id}>
                <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {p.name} <span className="font-normal text-muted">{p.unit}</span>
                    </span>
                    <span className="block text-[11.5px] text-muted">
                      Stock {p.stock} · sells {p.dailyVelocity}/day
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-[12px] font-bold", st === "out" ? "text-bad" : st === "risk" ? "text-warn" : st === "daily" ? "text-sky-700" : "text-good")}>
                    {st === "out" ? "Out" : st === "daily" ? "Daily supply" : `${Math.round(d)}d left`}
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", open && "rotate-180")} aria-hidden />
                </button>
                {open && (
                  <div className="bg-canvas/60 px-4 pb-3 pt-1 text-[12.5px]">
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt className="text-muted">Supplier</dt>
                      <dd className="truncate text-right text-ink">{s.supplierName}</dd>
                      <dt className="text-muted">Reorder point</dt>
                      <dd className="text-right text-ink">{s.reorderPoint} units</dd>
                      <dt className="text-muted">Lead time</dt>
                      <dd className="text-right text-ink">{p.leadTimeDays} day(s)</dd>
                      <dt className="text-muted">Procurement cost</dt>
                      <dd className="text-right text-ink">
                        ₹{p.cost} / unit · margin {Math.round(((p.price - p.cost) / p.price) * 100)}%
                      </dd>
                      <dt className="text-muted">Suggested order</dt>
                      <dd className="text-right font-bold text-ink">
                        {s.quantity} · {formatINR(s.cost)}
                      </dd>
                    </dl>
                    {!p.dailyReplenished && (
                      <Button size="sm" variant="outline" className="mt-2 w-full" icon={Truck} onClick={() => setSheet({ type: "confirm", proposal: reorderProposal(p), confirmLabel: "APPROVE ORDER" })}>
                        Prepare reorder
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <Button variant="outline" className="w-full" icon={Sparkles} disabled={busy} onClick={() => sendMessage("Stock yaavaga mugiyutte?")}>
          Ask Galla: “Stock yaavaga mugiyutte?”
        </Button>
      </div>
    </div>
  );
}
