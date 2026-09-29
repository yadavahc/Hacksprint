"use client";

import { motion } from "framer-motion";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline, Reveal } from "./primitives";

const TRADITIONAL = [
  { t: "Data", you: false },
  { t: "Dashboard", you: false },
  { t: "You analyze", you: true },
  { t: "You decide", you: true },
  { t: "You act", you: true },
];
const GALLA = [
  { t: "Data", you: false },
  { t: "AI understands", you: false },
  { t: "AI explains", you: false },
  { t: "AI simulates", you: false },
  { t: "You approve", you: true },
  { t: "AI acts", you: false },
  { t: "AI learns", you: false },
];

function Lane({ title, steps, keyframes, times, duration, accent, note }: { title: string; steps: typeof GALLA; keyframes: string[]; times: number[]; duration: number; accent: "slow" | "fast"; note: string }) {
  return (
    <div className={cn("rounded-3xl p-6 sm:p-8", accent === "fast" ? "bg-navy-900 text-white" : "bg-white text-ink shadow-card")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={cn("text-[13px] font-extrabold uppercase tracking-[0.22em]", accent === "fast" ? "text-sky" : "text-muted")}>{title}</p>
        <p className={cn("text-[13px] font-semibold", accent === "fast" ? "text-white/70" : "text-muted")}>{note}</p>
      </div>
      <div className="relative mt-6 hidden md:block">
        <div className={cn("absolute left-[6%] right-[6%] top-1/2 h-[2px] -translate-y-1/2", accent === "fast" ? "bg-white/15" : "bg-line")} aria-hidden />
        <motion.span
          aria-hidden
          className={cn("absolute top-1/2 z-10 -ml-2 size-4 -translate-y-1/2 rounded-full", accent === "fast" ? "bg-sky shadow-[0_0_16px_#2cc5c9]" : "bg-warn")}
          animate={{ left: keyframes }}
          transition={{ duration, times, repeat: Infinity, ease: "easeInOut" }}
        />
        <ol className="relative flex justify-between gap-2">
          {steps.map((s) => (
            <li key={s.t} className={cn("rounded-full px-3 py-2 text-center text-[13px] font-bold", s.you ? (accent === "fast" ? "bg-good text-white" : "bg-warn-50 text-warn ring-1 ring-warn/30") : accent === "fast" ? "bg-white/10 text-white" : "bg-canvas text-ink")}>
              {s.t}
            </li>
          ))}
        </ol>
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-2 md:hidden">
        {steps.map((s, i) => (
          <li key={s.t} className={cn("rounded-xl px-3 py-2.5 text-[13.5px] font-bold", s.you ? (accent === "fast" ? "bg-good text-white" : "bg-warn-50 text-warn") : accent === "fast" ? "bg-white/10" : "bg-canvas")}>
            <span className="mr-1.5 opacity-50">{i + 1}</span>
            {s.t}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DifferentSection() {
  const pos = (n: number) => Array.from({ length: n }, (_, i) => `${6 + (i / (n - 1)) * 88}%`);
  const t = pos(5);
  const m = pos(7);
  return (
    <section className="bg-[#f4f8fc] px-5 py-24 sm:py-32" aria-labelledby="different-title">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <Eyebrow>Why it is different</Eyebrow>
          <div id="different-title" className="mt-4">
            <Headline lines={["Not another", "dashboard."]} className="text-[clamp(38px,6vw,76px)]" />
          </div>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-muted">Traditional merchant software makes you interpret charts. Galla interprets the business for you — and only needs you for the one decision that matters.</p>
          </Reveal>
        </div>
        <div className="mt-12 space-y-4">
          <Reveal>
            <Lane title="Traditional" steps={TRADITIONAL} keyframes={[t[0], t[1], t[2], t[2], t[3], t[3], t[4], t[4]]} times={[0, 0.1, 0.22, 0.45, 0.55, 0.75, 0.85, 1]} duration={9} accent="slow" note="You do 3 of 5 steps" />
          </Reveal>
          <Reveal delay={0.1}>
            <Lane title="Galla" steps={GALLA} keyframes={[m[0], m[1], m[2], m[3], m[4], m[4], m[5], m[6], m[6]]} times={[0, 0.08, 0.16, 0.24, 0.34, 0.6, 0.7, 0.8, 1]} duration={6} accent="fast" note="You do 1 of 7 — approve" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
