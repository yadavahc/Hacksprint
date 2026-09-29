"use client";

import { CircleCheck, CircleDashed, FileUp, Info, Share2, Sparkles } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { CreditView } from "@/components/chat/cards";
import { Button, Card, cn } from "@/components/ui/primitives";
import { computeReadiness } from "@/lib/credit/readiness";
import { uid } from "@/lib/data/format";
import { useGalla } from "@/lib/store/provider";
import { agentContext } from "@/lib/store/selectors";

export function CreditScreen() {
  const { state, navigate, sendMessage, busy, dispatch } = useGalla();
  const ctx = agentContext(state);
  const campaignCompleted = ctx.campaigns.some((c) => c.status === "completed");
  const r = computeReadiness({ documentIds: ctx.documentIds, campaignCompleted });
  const hasGst = ctx.documentIds.includes("doc-gst");

  const checklist = [
    { label: "12 months of UPI sales history", ok: true },
    { label: "Bank statement (Aug 2026)", ok: ctx.documentIds.includes("doc-bank") },
    { label: "Udyam / MSME registration", ok: ctx.documentIds.includes("doc-udyam") },
    { label: "GST returns (Jul–Aug 2026)", ok: hasGst },
    { label: "Obligations under 20% of monthly sales", ok: true },
    { label: "Recent sales trend stable", ok: campaignCompleted },
  ];

  return (
    <div className="pb-2">
      <ScreenHeader title="Credit readiness" subtitle="How prepared you are to apply" />
      <div className="space-y-3.5 px-4 pt-2">
        <CreditView readiness={r} />

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">What lenders usually look at</h3>
          <ul className="mt-2 space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-[13px]">
                {c.ok ? <CircleCheck className="size-5 shrink-0 text-good" aria-label="Done" /> : <CircleDashed className="size-5 shrink-0 text-warn" aria-label="Missing" />}
                <span className={cn(c.ok ? "text-ink" : "font-semibold text-warn")}>{c.label}</span>
              </li>
            ))}
          </ul>
          {!hasGst && (
            <Button className="mt-3 w-full" icon={FileUp} onClick={() => navigate("documents")}>
              Upload GST returns
            </Button>
          )}
        </Card>

        <Button variant="outline" className="w-full" icon={Sparkles} disabled={busy} onClick={() => sendMessage("Loan-ge ready iddina?")}>
          Ask Galla: “Loan-ge ready iddina?”
        </Button>
        <Button variant="ghost" className="w-full" icon={Share2} onClick={() => dispatch({ type: "TOAST", toast: { id: uid("t"), text: `Readiness summary prepared (${r.level}, ${r.score}/100) — demo only`, tone: "info" } })}>
          Prepare readiness summary
        </Button>

        <Card className="flex gap-2.5 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
          <p className="text-[12.5px] leading-snug text-muted">Galla does not approve, reject or offer loans. This is guidance based on your demo business data — every lender makes its own decision.</p>
        </Card>
      </div>
    </div>
  );
}
