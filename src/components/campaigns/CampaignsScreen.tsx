"use client";

import { FlaskConical, GraduationCap, Megaphone, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { CampaignTrackingCard } from "@/components/chat/cards";
import { LearningView } from "@/components/chat/MessageItem";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { customerStats } from "@/lib/data/customers";
import { formatINR } from "@/lib/data/format";
import { useGalla } from "@/lib/store/provider";
import { currentCustomers, snapshotOf } from "@/lib/store/selectors";

export function CampaignsScreen() {
  const { state, navigate, sendMessage, busy } = useGalla();
  const stats = useMemo(() => customerStats(currentCustomers(state)), [state]);
  const running = state.campaigns.filter((c) => c.status === "running");
  const completed = state.campaigns.filter((c) => c.status === "completed");

  return (
    <div className="pb-2">
      <ScreenHeader title="Campaigns" subtitle="Offers, targeting and results" />
      <div className="space-y-3.5 px-4 pt-2">
        <button type="button" onClick={() => navigate("whatif")} className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-navy to-navy-900 p-4 text-left text-white shadow-float">
          <span className="grid size-11 place-items-center rounded-xl bg-white/10">
            <FlaskConical className="size-5 text-sky" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">Merchant Twin</span>
            <span className="block text-[12px] text-white/75">Simulate an offer before you spend a rupee</span>
          </span>
        </button>

        {running.length === 0 && stats.atRisk > 0 && (
          <Card className="p-4">
            <Badge tone="info">Suggested by Galla</Badge>
            <p className="mt-2 text-[15px] font-bold text-ink">₹50 win-back for {stats.atRisk} inactive regulars</p>
            <p className="text-[12.5px] text-muted">Targeted offers beat store-wide discounts for this store (learned from Ugadi).</p>
            <Button className="mt-3" size="sm" icon={Sparkles} disabled={busy} onClick={() => sendMessage("₹50 offer kotre enagutte?")}>
              SEE PLAN
            </Button>
          </Card>
        )}

        {running.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-[13px] font-bold uppercase tracking-wider text-muted">Live</h2>
            {running.map((c) => (
              <CampaignTrackingCard key={c.id} campaignId={c.id} />
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-bold uppercase tracking-wider text-muted">Completed</h2>
          <Card className="divide-y divide-line overflow-hidden">
            {completed.map((c) => {
              const s = snapshotOf(c);
              return (
                <button key={c.id} type="button" onClick={() => navigate("campaign", { id: c.id })} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas/60">
                  <span className="grid size-10 place-items-center rounded-xl bg-canvas text-navy">
                    <Megaphone className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
                    <span className="block text-[11.5px] text-muted">
                      {s.returned} customers · {formatINR(s.sales)}
                    </span>
                  </span>
                  <span className={cn("text-[13px] font-extrabold", s.roi >= 1 ? "text-good" : "text-bad")}>ROI {s.roi}×</span>
                </button>
              );
            })}
          </Card>
        </section>
      </div>
    </div>
  );
}

export function CampaignDetailScreen() {
  const { state, navigate } = useGalla();
  const c = state.campaigns.find((x) => x.id === state.route.params?.id);
  if (!c) {
    return (
      <div>
        <ScreenHeader title="Campaign" parent="campaigns" />
        <Card className="m-4 p-5 text-center">
          <p className="text-sm font-semibold text-ink">Campaign not found</p>
          <Button className="mt-3" size="sm" onClick={() => navigate("campaigns")}>
            All campaigns
          </Button>
        </Card>
      </div>
    );
  }
  const s = snapshotOf(c);
  const learning = state.learnings.find((l) => l.id === c.learningId);
  const salesMax = Math.max(c.expected.salesHigh, s.sales) * 1.15;

  return (
    <div className="pb-2">
      <ScreenHeader title={c.name} subtitle={c.status === "running" ? "Live campaign" : "Completed campaign"} parent="campaigns" />
      <div className="space-y-3.5 px-4 pt-2">
        <CampaignTrackingCard campaignId={c.id} showDetails={false} />

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Expected vs actual sales</h3>
          <div className="relative mt-4 h-8">
            <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-canvas" />
            <div className="absolute top-3 h-2 rounded-full bg-sky/40" style={{ left: `${(c.expected.salesLow / salesMax) * 100}%`, width: `${((c.expected.salesHigh - c.expected.salesLow) / salesMax) * 100}%` }} aria-hidden />
            <div className="absolute top-0 h-8 w-1 -translate-x-1/2 rounded-full bg-good transition-[left] duration-500" style={{ left: `${(s.sales / salesMax) * 100}%` }} aria-hidden />
          </div>
          <div className="mt-1 flex justify-between text-[11.5px]">
            <span className="text-muted">
              Estimate {formatINR(c.expected.salesLow)}–{formatINR(c.expected.salesHigh)}
            </span>
            <span className="font-bold text-good">Actual {formatINR(s.sales)}</span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Offer</h3>
          <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[12.5px]">
            <dt className="text-muted">Offer</dt>
            <dd className="text-right font-semibold text-ink">₹{c.offerAmount} off</dd>
            <dt className="text-muted">Minimum bill</dt>
            <dd className="text-right font-semibold text-ink">₹{c.minBill}</dd>
            <dt className="text-muted">Audience</dt>
            <dd className="text-right font-semibold text-ink">{c.audienceSize} customers</dd>
            <dt className="text-muted">Channel</dt>
            <dd className="text-right font-semibold text-ink">{c.channel}</dd>
            <dt className="text-muted">Coupons redeemed</dt>
            <dd className="text-right font-semibold text-ink">
              {s.redeemed} · cost {formatINR(s.cost)}
            </dd>
          </dl>
          <div className="mt-3 max-w-[85%] rounded-2xl rounded-tl-md bg-[#e7f8ee] px-3 py-2 text-[13px] text-ink shadow-card">{c.message}</div>
        </Card>

        {learning ? (
          <LearningView learning={learning} />
        ) : (
          <Card className="flex items-center gap-3 p-4">
            <GraduationCap className="size-5 text-sky-700" aria-hidden />
            <p className="text-[12.5px] text-muted">Galla will compare expected vs actual results when the campaign ends.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
