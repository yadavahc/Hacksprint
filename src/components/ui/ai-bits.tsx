"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FlaskConical, Landmark, Package, ShieldCheck, Sparkles, Store, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import type { AgentName } from "@/lib/agents/types";
import { cn } from "./primitives";

export function GallaMark({ size = 28, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center rounded-[30%] bg-gradient-to-br from-sky to-navy text-white", className)} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        {[5, 9.5, 14, 18.5].map((x, i) => (
          <rect
            key={x}
            x={x - 1.3}
            y={[8, 4.5, 6.5, 10][i]}
            width="2.6"
            height={[8, 15, 11, 4][i]}
            rx="1.3"
            fill="currentColor"
            className={animated ? "animate-wave" : undefined}
            style={{ transformOrigin: `${x}px 12px`, animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </svg>
    </span>
  );
}

export const AGENT_ICON: Record<AgentName, LucideIcon> = {
  Growth: TrendingUp,
  Inventory: Package,
  Cashflow: Wallet,
  Safety: ShieldCheck,
  "Credit Readiness": Landmark,
  Digitalization: Store,
  Orchestrator: Sparkles,
};

export function AgentBadge({ agent, source }: { agent: AgentName; source?: "rules" | "llm" }) {
  const Icon = AGENT_ICON[agent];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
      <Icon className="size-3" aria-hidden />
      {agent === "Orchestrator" ? "Galla" : `${agent} Agent`}
      {source === "llm" && <span className="text-navy/60">· AI</span>}
    </span>
  );
}

export function SimulatedBadge({ label = "Simulated estimate" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-sky-600/60 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function ConfidencePill({ value, label }: { value: number; label: string }) {
  const dots = Math.max(1, Math.round(value * 5));
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted" aria-label={`${label}, confidence ${Math.round(value * 100)} percent`}>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("size-1.5 rounded-full", i < dots ? "bg-sky-600" : "bg-line")} />
        ))}
      </span>
      {label}
    </span>
  );
}

export function WhyGallaThinks({ reasons, uncertainty, title = "Why Galla thinks this", defaultOpen = false }: { reasons: string[]; uncertainty?: string; title?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rounded-xl bg-canvas/80">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-[12px] font-bold uppercase tracking-wide text-navy">
        <Sparkles className="size-3.5 text-sky-600" aria-hidden />
        <span className="flex-1">{title}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <ul className="space-y-1.5 px-3 pb-3">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2 text-[13px] leading-snug text-ink">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                  {r}
                </li>
              ))}
              {uncertainty && <li className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[12px] leading-snug text-muted">⚖️ {uncertainty}</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
