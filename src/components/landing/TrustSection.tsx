"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ChevronDown, FlaskConical, Hand, History, Lock, Scale, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline, Reveal } from "./primitives";

const PRINCIPLES = [
  { icon: Sparkles, t: "Explainable AI", d: "Every important answer shows why — with the evidence behind it." },
  { icon: Hand, t: "Merchant approval", d: "Galla proposes. You approve, edit or cancel. Always." },
  { icon: Lock, t: "No automatic real-money transactions", d: "Galla never moves money. In this prototype, every action is simulated." },
  { icon: History, t: "Audit trail", d: "What, why, expected result, who approved and status — for every action." },
  { icon: Scale, t: "Honest uncertainty", d: "“Likely”, “estimated”, “based on current data” — or “I don't have enough data to be certain.”" },
];

export function TrustSection() {
  const [open, setOpen] = useState(true);
  return (
    <section id="trust" className="scroll-mt-16 bg-[#f4f8fc] px-5 py-24 sm:py-32" aria-labelledby="trust-title">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <Eyebrow>Trust & explainability</Eyebrow>
          <div id="trust-title" className="mt-4">
            <Headline lines={["An AI teammate", "you can check."]} className="text-[clamp(34px,5.4vw,68px)]" />
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-muted">Insight</p>
              <p className="mt-2 text-[48px] font-extrabold leading-none text-bad">Sales ↓ 11%</p>
              <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-6 flex min-h-11 w-full items-center gap-2 rounded-2xl bg-canvas px-4 text-left text-[13px] font-extrabold uppercase tracking-wider text-navy">
                <Sparkles className="size-4 text-sky-600" aria-hidden />
                <span className="flex-1">Why Galla thinks this</span>
                <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="mt-4 text-[13px] font-bold text-muted">Because:</p>
                    <ul className="mt-2 divide-y divide-line">
                      {[
                        ["47 repeat customers inactive", "14+ days"],
                        ["Evening traffic", "↓ 18%"],
                        ["Popular product unavailable", "Atta · 3 days"],
                      ].map(([k, v]) => (
                        <li key={k} className="flex items-center justify-between py-3 text-[16px]">
                          <span className="font-semibold text-ink">{k}</span>
                          <span className="font-extrabold text-bad">{v}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 rounded-xl bg-canvas px-3 py-2.5 text-[13.5px] text-muted">⚖️ Payments show who stopped buying — not why evenings are quieter. Galla says so.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl bg-white p-6 shadow-card sm:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-muted">Prediction</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-sky-600/60 bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                  <FlaskConical className="size-3.5" aria-hidden /> Simulated estimate
                </span>
              </div>
              <p className="mt-3 text-[20px] font-bold text-ink">₹50 win-back → returning customers</p>
              <div className="relative mt-8 h-12">
                <div className="absolute inset-x-0 top-5 h-2 rounded-full bg-canvas" />
                <motion.div className="absolute top-5 h-2 rounded-full bg-series-1" initial={{ left: "0%", width: "0%" }} whileInView={{ left: `${(8 / 20) * 100}%`, width: `${(4 / 20) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.3 }} />
                <span className="absolute top-0 text-[13px] font-extrabold text-ink" style={{ left: "38%" }}>
                  8
                </span>
                <span className="absolute top-0 text-[13px] font-extrabold text-ink" style={{ left: "59%" }}>
                  12
                </span>
                <span className="absolute top-9 text-[11px] text-faint">0</span>
                <span className="absolute right-0 top-9 text-[11px] text-faint">20</span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">A range, not a promise — with the assumptions shown: ₹525 average basket, 24% margin, 7-day validity.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Likely", "Estimated", "Based on current data", "Not enough data to be certain"].map((c) => (
                  <span key={c} className="rounded-full bg-canvas px-3 py-1.5 text-[12.5px] font-semibold text-ink">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <ul className="mt-5 grid gap-px overflow-hidden rounded-3xl bg-line sm:grid-cols-2 lg:grid-cols-5">
          {PRINCIPLES.map((p, i) => (
            <motion.li key={p.t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white p-6">
              <p.icon className="size-6 text-sky-700" aria-hidden />
              <p className="mt-3 text-[16px] font-extrabold leading-tight text-navy-900">{p.t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.d}</p>
            </motion.li>
          ))}
        </ul>
        <p className="mt-5 flex items-center gap-2 text-[13px] text-muted">
          <BadgeCheck className="size-4 text-good" aria-hidden /> The LLM never computes balances or changes data — deterministic code does, and every change needs approval.
        </p>
      </div>
    </section>
  );
}
