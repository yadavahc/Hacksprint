"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { RiskView } from "@/components/chat/cards";
import { Avatar } from "@/components/ui/animated-number";
import { Button, Card, cn } from "@/components/ui/primitives";
import { formatINR } from "@/lib/data/format";
import { BENEFICIARIES } from "@/lib/data/safety";
import { assessRisk } from "@/lib/risk/riskEngine";
import { useGalla } from "@/lib/store/provider";
import { ScamGraph } from "./ScamGraph";

export function BeneficiaryScreen() {
  const { sendMessage, busy } = useGalla();
  const [selectedId, setSelectedId] = useState("b-karthik");
  const [checked, setChecked] = useState<Record<string, "checking" | "done">>({});
  const b = BENEFICIARIES.find((x) => x.id === selectedId)!;
  const status = checked[b.id];
  const ratio = Math.round((b.requestedAmount / b.usualAmount) * 10) / 10;

  const check = () => {
    setChecked((c) => ({ ...c, [b.id]: "checking" }));
    setTimeout(() => setChecked((c) => ({ ...c, [b.id]: "done" })), 1400);
  };

  return (
    <div className="pb-2">
      <ScreenHeader title="Beneficiary check" subtitle="Wrong-person transfer gate" parent="qr" />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Choose a transfer to check">
          {BENEFICIARIES.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === selectedId} onClick={() => setSelectedId(x.id)} className={cn("h-10 shrink-0 rounded-full px-3.5 text-[12.5px] font-semibold ring-1 transition-colors", x.id === selectedId ? "bg-navy text-white ring-navy" : "bg-white text-ink ring-line hover:ring-navy/40")}>
              {x.displayName}
            </button>
          ))}
        </div>

        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">You are about to pay</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={b.displayName} size={44} tone="navy" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink">{b.displayName}</p>
              <p className="truncate text-[12px] text-muted">{b.vpa}</p>
              <p className="text-[11.5px] text-muted">
                Bank name: <b className="text-ink">{b.bankName}</b>
              </p>
            </div>
          </div>
          <p className="mt-3 text-[30px] font-extrabold text-ink">{formatINR(b.requestedAmount)}</p>
          <p className="text-[12px] text-muted">Your usual supplier payment: {formatINR(b.usualAmount)}</p>
          <p className="mt-2 rounded-lg bg-canvas px-2.5 py-2 text-[12px] italic text-muted">{b.context}</p>
          {!status && (
            <Button className="mt-3 w-full" size="lg" icon={ShieldCheck} onClick={check}>
              CHECK RECIPIENT
            </Button>
          )}
          {status === "checking" && (
            <div className="mt-3" aria-live="polite">
              <p className="text-[13px] font-semibold text-navy">Checking 9 signals against 26 months of payments…</p>
              <div className="mt-2 flex gap-1" aria-hidden>
                {Array.from({ length: 9 }, (_, i) => (
                  <motion.span key={i} className="h-1.5 flex-1 rounded-full bg-sky" initial={{ opacity: 0.15 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.13 }} />
                ))}
              </div>
            </div>
          )}
        </Card>

        {status === "done" && (
          <>
            {b.id === "b-karthik" && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-bad-50 px-4 py-3 text-[14px] font-semibold leading-snug text-bad">
                This recipient is new and the amount is {ratio}× your usual supplier payment.
              </motion.p>
            )}
            <RiskView assessment={assessRisk(b.signals)} title={`${b.displayName} · ${formatINR(b.requestedAmount)}`} subtitle={`${b.vpa} · ${b.relationship}`} subjectKind="beneficiary" subjectId={b.id} />
          </>
        )}

        <ScamGraph />

        <Button variant="outline" className="w-full" icon={Sparkles} disabled={busy} onClick={() => sendMessage("Karthik Enterprises-ge ₹35,700 kalisbeka?")}>
          Ask Galla about this transfer
        </Button>
      </div>
    </div>
  );
}
