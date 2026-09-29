"use client";

import { BellRing, Building2, Check, CircleCheck, MessageSquareText } from "lucide-react";
import { useMemo } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { CashBreakdown, MandateView } from "@/components/chat/cards";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { cashPosition, predictMandate } from "@/lib/cashflow/cashflow";
import { BANK_ACCOUNTS } from "@/lib/data/finance";
import { formatINR } from "@/lib/data/format";
import { confirmPatternProposal, reminderProposal } from "@/lib/store/proposals";
import { useGalla } from "@/lib/store/provider";

const SOURCE_LABEL = { mandate: "AutoPay mandate", invoice: "From invoice", merchant: "You told Galla", detected: "Detected pattern" } as const;

export function CashflowScreen() {
  const { state, setSheet, sendMessage, busy, dispatch } = useGalla();
  const pos = useMemo(() => cashPosition(state.obligations, state.patterns), [state.obligations, state.patterns]);
  const mandate = useMemo(() => predictMandate(state.obligations, state.reminders), [state.obligations, state.reminders]);
  const pending = state.patterns.filter((p) => !p.confirmed);

  return (
    <div className="pb-2">
      <ScreenHeader title="Cashflow Guardian" subtitle="What's truly yours to spend" />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "AVAILABLE NOW", value: pos.available, note: "Free to use", tone: "text-series-1" },
            { label: "COMMITTED", value: pos.committed, note: "Promised in 30d", tone: "text-series-2" },
            { label: "EXPECTED", value: pos.expected, note: "Likely in 7d", tone: "text-series-3" },
          ].map((t) => (
            <Card key={t.label} className="p-3">
              <p className={cn("text-[9.5px] font-extrabold tracking-wider", t.tone)}>{t.label}</p>
              <p className="tabular mt-0.5 text-[15px] font-extrabold text-ink">{formatINR(t.value)}</p>
              <p className="text-[10.5px] text-muted">{t.note}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <p className="text-[12.5px] text-muted">
            Your accounts show <b className="text-ink">{formatINR(pos.balance)}</b>, but that isn&apos;t all spendable.
          </p>
          <div className="mt-3">
            <CashBreakdown position={pos} />
          </div>
          <ul className="mt-3 space-y-2 border-t border-line pt-3">
            {BANK_ACCOUNTS.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-canvas text-navy">
                  <Building2 className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">
                    {a.bank} {a.id.split(" ")[1]}
                  </span>
                  <span className="block text-[11px] text-muted">{a.role}</span>
                </span>
                <span className="tabular text-[13.5px] font-bold text-ink">{formatINR(a.balance)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {mandate && (
          <div className="space-y-2">
            <h2 className="px-1 text-[13px] font-bold uppercase tracking-wider text-muted">UPI mandate prediction</h2>
            <MandateView prediction={mandate} />
            {mandate.shortfall > 0 && !mandate.mitigated && (
              <Button
                className="w-full"
                icon={BellRing}
                onClick={() =>
                  setSheet({
                    type: "confirm",
                    proposal: reminderProposal({
                      agent: "Cashflow",
                      title: `Move ₹2,000 from HDFC ••4421 to ${mandate.account}`,
                      note: `EMI of ${formatINR(mandate.amount)} debits in ${mandate.dueInDays} days. Galla never moves money — this is a reminder only.`,
                      dueInDays: 1,
                      why: `${mandate.account} will be short by ${formatINR(mandate.shortfall)}`,
                      expected: "EMI succeeds · no bounce charges",
                    }),
                  })
                }
              >
                Set a reminder to top up
              </Button>
            )}
          </div>
        )}

        <Card className="overflow-hidden">
          <h3 className="px-4 pt-4 text-sm font-bold text-ink">Promised-away money · next 30 days</h3>
          <ul className="mt-2 divide-y divide-line">
            {pos.items.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{o.title}</span>
                  <span className="block text-[11px] text-muted">
                    In {o.dueInDays} days · {SOURCE_LABEL[o.source]}
                  </span>
                </span>
                <span className="tabular text-[13.5px] font-bold text-ink">{formatINR(o.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2.5 text-[12px] text-muted">
            Total committed <b className="text-ink">{formatINR(pos.committed)}</b> · each obligation is counted once.
          </p>
        </Card>

        {pending.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-ink">Galla noticed recurring payments</h3>
            <p className="text-[12px] text-muted">Not counted until you confirm — so nothing is double-counted.</p>
            <ul className="mt-3 space-y-2.5">
              {pending.map((p) => (
                <li key={p.id} className="rounded-xl bg-canvas p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-ink">
                      {p.title} · {formatINR(p.amount)}
                    </p>
                    <Badge tone="info">{Math.round(p.confidence * 100)}% sure</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{p.evidence}</p>
                  <Button size="sm" variant="outline" className="mt-2" icon={Check} onClick={() => setSheet({ type: "confirm", proposal: confirmPatternProposal(p), confirmLabel: "CONFIRM" })}>
                    Confirm & include
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-sky-700" aria-hidden />
            <h3 className="text-sm font-bold text-ink">Tell Galla about a payment you promised</h3>
          </div>
          <div className="mt-2.5 flex flex-col gap-2">
            {["Naanu prati tingalu ₹10,000 rent kodtini.", "Supplier-ge ₹12,000 Friday kodbeku.", "Nijavaagi eshtu hana available ide?"].map((p) => (
              <button key={p} type="button" disabled={busy} onClick={() => sendMessage(p)} className="min-h-10 rounded-xl bg-sky-50 px-3 text-left text-[13px] font-semibold text-navy ring-1 ring-sky-100 hover:bg-sky-100 disabled:opacity-50">
                “{p}”
              </button>
            ))}
          </div>
        </Card>

        {state.reminders.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-ink">Reminders</h3>
            <ul className="mt-2 space-y-2">
              {state.reminders.map((r) => (
                <li key={r.id}>
                  <button type="button" role="checkbox" aria-checked={r.done} onClick={() => dispatch({ type: "TOGGLE_REMINDER", id: r.id })} className="flex w-full items-start gap-2.5 text-left">
                    <CircleCheck className={cn("mt-0.5 size-5 shrink-0", r.done ? "text-good" : "text-line")} aria-hidden />
                    <span>
                      <span className={cn("block text-[13px] font-semibold", r.done ? "text-muted line-through" : "text-ink")}>{r.title}</span>
                      <span className="block text-[11.5px] text-muted">{r.note}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
