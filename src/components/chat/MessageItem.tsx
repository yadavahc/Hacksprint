"use client";

import { motion } from "framer-motion";
import { Check, CircleAlert, CircleCheck, GraduationCap, Lock, Mic, Pencil } from "lucide-react";
import { useEffect, useRef } from "react";
import { AgentBadge, ConfidencePill, GallaMark } from "@/components/ui/ai-bits";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { formatINR } from "@/lib/data/format";
import { useGalla } from "@/lib/store/provider";
import type { ChatMessage, Learning } from "@/lib/store/types";
import { CampaignTrackingCard, ResponseCard } from "./cards";

const enter = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28 } };

export function MessageItem({ message: m }: { message: ChatMessage }) {
  if (m.role === "merchant") {
    return (
      <motion.div {...enter} className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-navy px-3.5 py-2.5 text-[14px] leading-snug text-white">
          {m.via === "voice" && (
            <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-100">
              <Mic className="size-3" aria-hidden />
              Voice
            </span>
          )}
          {m.text}
        </div>
      </motion.div>
    );
  }

  if (m.kind === "learning") return <LearningMessage message={m} />;

  if (m.kind === "result" || m.kind === "error") {
    const ok = m.kind === "result";
    return (
      <motion.div {...enter} className="flex gap-2">
        <GallaMark size={28} className="mt-0.5" />
        <div className="min-w-0 max-w-[88%] flex-1 space-y-2">
          <div className={cn("flex items-start gap-2 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[14px] leading-snug", ok ? "bg-good-50 text-ink" : "bg-bad-50 text-ink")}>
            {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-good" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />}
            <span>{m.text}</span>
          </div>
          {m.campaignId && <CampaignTrackingCard campaignId={m.campaignId} />}
        </div>
      </motion.div>
    );
  }

  const r = m.response;
  return (
    <motion.div {...enter} className="flex gap-2">
      <GallaMark size={28} className="mt-0.5" />
      <div className="min-w-0 max-w-[90%] flex-1 space-y-2">
        <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-card">
          {r && (
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <AgentBadge agent={r.agent} source={r.source} />
              <ConfidencePill value={r.confidence} label={r.confidenceLabel} />
            </div>
          )}
          <p className="text-[14px] leading-relaxed text-ink">{m.text}</p>
          {r?.uncertainty && !r.cards.some((c) => c.type === "insight") && <p className="mt-2 border-t border-line pt-2 text-[12px] leading-snug text-muted">{r.uncertainty}</p>}
        </div>
        {r?.cards.map((c, i) => <ResponseCard key={`${m.id}-${i}`} card={c} response={r} />)}
        {m.proposalId && <ProposalCard proposalId={m.proposalId} />}
      </div>
    </motion.div>
  );
}

export function ProposalCard({ proposalId }: { proposalId: string }) {
  const { state, approve, cancel, setSheet } = useGalla();
  const ref = useRef<HTMLDivElement>(null);
  const rec = state.proposals[proposalId];
  const highlight = state.demo.highlight === "approve" && rec?.status === "pending";
  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight]);
  if (!rec) return null;
  const { proposal: p, status } = rec;
  const executing = status === "pending" && state.stage === "EXECUTING";
  const statusBadge = {
    pending: <Badge tone="warn">Waiting for your approval</Badge>,
    approved: <Badge tone="good" icon={Check}>Approved by you</Badge>,
    failed: <Badge tone="bad">Couldn&apos;t complete</Badge>,
    cancelled: <Badge tone="neutral">Cancelled</Badge>,
  }[status];

  return (
    <div ref={ref} className={cn("rounded-2xl bg-white p-3.5 shadow-card ring-2 transition-shadow", status === "pending" ? "ring-sky/50" : "ring-transparent")}>
      {statusBadge}
      <p className="mt-2 text-[14px] font-semibold leading-snug text-ink">{p.summary}</p>
      <dl className="mt-2.5 space-y-1.5 text-[12.5px]">
        {[
          ["WHAT", p.title],
          ["WHY", p.why],
          ["EXPECTED", p.expected],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-[68px] shrink-0 text-[10px] font-extrabold tracking-wider text-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {p.payload.kind === "create_campaign" && (
        <div className="mt-2.5 rounded-xl bg-canvas p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Message customers will get · {p.payload.channel}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-ink">{p.payload.message}</p>
        </div>
      )}
      {p.payload.kind === "prepare_supplier_order" && (
        <ul className="mt-2.5 space-y-1 rounded-xl bg-canvas p-2.5 text-[12.5px]">
          {p.payload.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span>
                {l.quantity} × {l.name}
              </span>
              <span className="tabular font-semibold">{formatINR(l.quantity * l.unitCost)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-line pt-1 font-bold">
            <span>Estimated cost</span>
            <span className="tabular">{formatINR(p.payload.total)}</span>
          </li>
        </ul>
      )}
      {status === "pending" ? (
        <div className="mt-3 flex gap-2">
          <Button variant="success" icon={Check} onClick={() => approve(p.id)} disabled={executing} data-demo="approve" className={cn("flex-1", highlight && "demo-highlight")}>
            {executing ? "Executing…" : "APPROVE"}
          </Button>
          {p.editable && (
            <Button variant="outline" icon={Pencil} onClick={() => setSheet({ type: "edit-proposal", proposalId })} disabled={executing}>
              EDIT
            </Button>
          )}
          <Button variant="ghost" onClick={() => cancel(p.id)} disabled={executing}>
            CANCEL
          </Button>
        </div>
      ) : (
        rec.note && <p className="mt-2 text-[12px] text-muted">{rec.note}</p>
      )}
      <p className="mt-2.5 flex items-center gap-1 text-[10.5px] text-faint">
        <Lock className="size-3" aria-hidden />
        Simulated action · nothing changes without your approval
      </p>
    </div>
  );
}

function LearningMessage({ message }: { message: ChatMessage }) {
  const { state, navigate } = useGalla();
  const learning = state.learnings.find((l) => l.id === message.learningId);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 18 }} className="flex gap-2">
      <GallaMark size={28} className="mt-0.5" />
      <div className="min-w-0 max-w-[90%] flex-1">
        {learning ? <LearningView learning={learning} headline={message.text} /> : <Card className="p-3 text-sm">{message.text}</Card>}
        <Button variant="ghost" size="sm" className="mt-1" onClick={() => navigate("history")}>
          View action history
        </Button>
      </div>
    </motion.div>
  );
}

export function LearningView({ learning, headline }: { learning: Learning; headline?: string }) {
  const good = learning.outcome === "better";
  return (
    <div className={cn("overflow-hidden rounded-2xl shadow-card", good ? "bg-gradient-to-br from-[#e5f7ee] to-white" : "bg-white")}>
      <div className="flex items-center gap-2 px-3.5 pt-3">
        <span className={cn("grid size-8 place-items-center rounded-xl", good ? "bg-good text-white" : "bg-canvas text-muted")}>
          <GraduationCap className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={cn("text-[11px] font-extrabold tracking-wider", good ? "text-good" : "text-muted")}>{headline ? "LEARNING COMPLETE" : "LEARNING"}</p>
          <p className="truncate text-[13px] font-semibold text-ink">{headline ? headline.replace(/^LEARNING COMPLETE — /, "") : learning.title}</p>
        </div>
      </div>
      <dl className="space-y-1.5 px-3.5 py-3 text-[12.5px]">
        {[
          ["Expected", learning.expected],
          ["Actual", learning.actual],
          ["Difference", learning.difference],
          ["Learning", learning.learning],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-[74px] shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-muted">{k}</dt>
            <dd className={cn("text-ink", k === "Actual" && good && "font-bold text-good")}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-line bg-white/60 px-3.5 py-2 text-[11.5px] text-muted">↻ {learning.applied}</p>
    </div>
  );
}
