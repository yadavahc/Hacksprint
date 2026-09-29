"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowRight, Check, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import { CtaLink } from "./primitives";

const PAYMENTS = [
  ["₹240", "UPI · Kavya S."],
  ["₹85", "Cash"],
  ["₹1,450", "UPI · Ravi G."],
  ["₹32", "UPI · Tejas N."],
  ["₹610", "UPI · Deepa R."],
  ["₹120", "Card"],
  ["₹415", "UPI · Imran K."],
];

const GALLA_STATES = ["UNDERSTANDING", "ANALYZING", "PREDICTING", "PLANNING"];

function Connector({ vertical = false, delay = 0 }: { vertical?: boolean; delay?: number }) {
  return (
    <div aria-hidden className={cn("relative shrink-0", vertical ? "mx-auto h-10 w-px" : "h-px w-10 self-center xl:w-14")}>
      <div className={cn("absolute bg-gradient-to-r from-sky/10 via-sky/50 to-sky/10", vertical ? "inset-x-0 inset-y-0 bg-gradient-to-b" : "inset-0")} />
      <motion.span
        className="absolute size-1.5 rounded-full bg-sky shadow-[0_0_10px_#2cc5c9]"
        style={vertical ? { left: -2.5 } : { top: -2.5 }}
        animate={vertical ? { top: ["0%", "100%"] } : { left: ["0%", "100%"] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </div>
  );
}

function SignalFlow() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, []);
  const approved = tick % 6 >= 4;
  const state = GALLA_STATES[tick % GALLA_STATES.length];

  const shell = "rounded-2xl p-3.5";
  const col = `${shell} bg-white/[0.06] ring-1 ring-white/10 backdrop-blur`;
  const label = "mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50";

  return (
    <div className="relative mx-auto mt-14 flex max-w-5xl flex-col items-stretch gap-0 lg:flex-row lg:items-center lg:gap-0" aria-label="Animation: transactions become customer signals, Galla reasons over them and proposes an action">
      <div className={cn(col, "lg:w-[210px]")}>
        <p className={label}>Transactions</p>
        <div className="relative h-[132px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
          <motion.ul animate={{ y: ["0%", "-50%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="space-y-1.5">
            {[...PAYMENTS, ...PAYMENTS].map(([amt, who], i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-[12px]">
                <span className="text-white/70">{who}</span>
                <span className="font-bold text-white">{amt}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>

      <div className="lg:hidden">
        <Connector vertical />
      </div>
      <div className="hidden lg:block">
        <Connector />
      </div>

      <div className={cn(col, "lg:w-[220px]")}>
        <p className={label}>Customers & signals</p>
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-2.5 py-2">
          <Users className="size-4 text-sky" aria-hidden />
          <span className="text-[12.5px] text-white/80">684 customers</span>
          <span className="ml-auto flex items-center gap-1 text-[11.5px] font-bold text-[#ff8a8a]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#ff6b6b]" aria-hidden />
            47 inactive
          </span>
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {["Sales ↓ 11%", "Evening ↓ 18%", "Atta out of stock"].map((s, i) => (
            <motion.li key={s} animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} className="rounded-full bg-white/[0.08] px-2 py-1 text-[11px] font-semibold text-white/85">
              {s}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="lg:hidden">
        <Connector vertical delay={0.3} />
      </div>
      <div className="hidden lg:block">
        <Connector delay={0.3} />
      </div>

      <div className={cn(shell, "bg-gradient-to-br from-sky/20 to-white/[0.04] ring-1 ring-sky/40 backdrop-blur lg:w-[210px]")}>
        <p className={label}>Galla</p>
        <div className="flex items-center gap-2.5">
          <GallaMark size={36} animated />
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.p key={state} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-[12px] font-extrabold tracking-wider text-sky">
                {state}
              </motion.p>
            </AnimatePresence>
            <p className="text-[11.5px] text-white/60">Growth Agent</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {GALLA_STATES.map((s, i) => (
            <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors duration-500", i <= tick % GALLA_STATES.length ? "bg-sky" : "bg-white/15")} />
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        <Connector vertical delay={0.6} />
      </div>
      <div className="hidden lg:block">
        <Connector delay={0.6} />
      </div>

      <div className={cn(shell, "bg-white text-ink lg:w-[240px]")}>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">Action</p>
        <p className="text-[13.5px] font-bold leading-snug text-navy-900">₹50 win-back for 47 customers</p>
        <p className="mt-0.5 text-[11.5px] text-muted">8–12 likely to return · simulated</p>
        <motion.div layout className={cn("mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-extrabold tracking-wide transition-colors", approved ? "bg-good text-white" : "bg-navy text-white")}>
          {approved ? (
            <>
              <Check className="size-4" aria-hidden /> CAMPAIGN LIVE
            </>
          ) : (
            "APPROVE"
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-deep pb-24 pt-32 text-white sm:pt-40" aria-labelledby="hero-title">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[680px] w-[1100px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(44,197,201,0.28),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 text-center">
        {/* Hero copy animates with CSS so it is fully visible even before JavaScript hydrates. */}
        <p className="inline-flex animate-rise items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.24em] text-sky ring-1 ring-white/10">
          <GallaMark size={18} /> GALLA
        </p>
        <h1 id="hero-title" className="mt-6 text-[clamp(38px,7vw,88px)] font-extrabold uppercase leading-[0.95] tracking-[-0.035em]">
          <span className="block animate-rise" style={{ animationDelay: "0.1s" }}>
            Aapka udhaar,
          </span>
          <span className="block animate-rise bg-gradient-to-r from-sky via-[#8ceae8] to-sky bg-clip-text text-transparent" style={{ animationDelay: "0.25s" }}>
            wapas aapke galla mein.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-rise text-[clamp(16px,2.1vw,21px)] leading-relaxed text-white/75" style={{ animationDelay: "0.45s" }}>
          An agentic AI back-office that turns a kirana&apos;s informal udhaar book into recovered cash and lender-ready credit history. You say it — GALLA gets it done.
        </p>
        <div className="mt-9 flex animate-rise flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.6s" }}>
          <CtaLink href="/app">
            Try Galla <ArrowRight className="size-4" aria-hidden />
          </CtaLink>
          <a href="#demo" className="inline-flex min-h-12 items-center gap-2 rounded-full px-7 text-[14px] font-extrabold uppercase tracking-wider text-white ring-1 ring-white/25 transition-colors hover:bg-white/10">
            See how Galla works <ArrowDown className="size-4" aria-hidden />
          </a>
        </div>
        <SignalFlow />
      </div>
    </section>
  );
}
