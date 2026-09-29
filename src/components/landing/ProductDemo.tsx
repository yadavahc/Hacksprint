"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, CircleCheck, FlaskConical, GraduationCap, LoaderCircle, Mic, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline } from "./primitives";

// A cinematic, fully animated product demo built from real UI-style components (no video file).

type Sfx = "pop" | "tap" | "chime";

function useSfx(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(
    (kind: Sfx) => {
      if (muted) return;
      try {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = ctxRef.current ?? new Ctor();
        ctxRef.current = ctx;
        const notes = kind === "chime" ? [660, 880, 1320] : kind === "tap" ? [240] : [540];
        const now = ctx.currentTime;
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          const t = now + i * 0.09;
          o.type = "sine";
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.1, t + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          o.connect(g).connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.3);
        });
      } catch {
        // Audio is optional.
      }
    },
    [muted],
  );
}

function TypeText({ text, delay = 0, speed = 28 }: { text: string; delay?: number; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const start = setTimeout(function tick() {
      i += 1;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed);
    }, delay * 1000);
    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
  }, [text, delay, speed]);
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-current" />}
    </span>
  );
}

function Counter({ to, prefix = "", suffix = "", decimals = 0, delay = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number; delay?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const startAt = performance.now() + delay * 1000;
    const loop = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - startAt) / 1300));
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return (
    <span>
      {prefix}
      {v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

const pop = (delay = 0) => ({ initial: { opacity: 0, y: 14, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] as const } });

function GallaBubble({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div {...pop(delay)} className="flex gap-2.5">
      <GallaMark size={30} className="mt-0.5" />
      <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-card">{children}</div>
    </motion.div>
  );
}

function MerchantBubble({ text }: { text: string }) {
  return (
    <motion.div {...pop(0)} className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-navy px-4 py-3 text-[15px] text-white">
        <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-sky-100">
          <Mic className="size-3" aria-hidden /> Voice · Kanglish
          <span className="ml-1 flex h-3 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-[2px] animate-wave rounded-full bg-sky" style={{ height: 10, animationDelay: `${i * 0.1}s`, transformOrigin: "bottom" }} />
            ))}
          </span>
        </span>
        <TypeText text={text} delay={0.5} />
      </div>
    </motion.div>
  );
}

const SCENES: { label: string; stage: string; ms: number; render: () => ReactNode }[] = [
  {
    label: "Galla notices first",
    stage: "READY",
    ms: 4000,
    render: () => (
      <div className="space-y-3">
        <GallaBubble>Good morning. I&apos;ve found 3 things that need your attention.</GallaBubble>
        <div className="ml-10 space-y-2">
          {["47 regular customers haven't purchased in 14 days", "Parle-G may run out in 3 days", "₹7,500 EMI may fail in 3 days"].map((t, i) => (
            <motion.div key={t} {...pop(0.5 + i * 0.25)} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-card">
              <span className={cn("grid size-7 place-items-center rounded-lg text-[12px] font-extrabold", i === 0 ? "bg-bad-50 text-bad" : "bg-warn-50 text-warn")}>{i + 1}</span>
              <span className="text-[14px] font-semibold text-ink">{t}</span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  { label: "You ask, in your language", stage: "LISTENING", ms: 3800, render: () => <MerchantBubble text="Nanna sales ee vaara yaake kadime aagide?" /> },
  {
    label: "Galla finds the why",
    stage: "ANALYZING",
    ms: 5000,
    render: () => (
      <div className="space-y-3">
        <motion.ul {...pop(0)} className="ml-10 space-y-1.5 rounded-2xl bg-white p-3.5 shadow-card">
          {["Comparing this week with your 4-week average", "Checking 684 customers for unusual gaps", "Looking at hours and products"].map((t, i) => (
            <motion.li key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.45 }} className="flex items-center gap-2 text-[13px] text-muted">
              <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: i * 0.45 + 0.4 }} className="absolute">
                <LoaderCircle className="size-4 animate-spin text-sky-600" aria-hidden />
              </motion.span>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.45 + 0.4 }}>
                <CircleCheck className="size-4 text-good" aria-hidden />
              </motion.span>
              {t}
            </motion.li>
          ))}
        </motion.ul>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { v: <>↓ <Counter to={11} delay={1.5} suffix="%" /></>, l: "Sales this week", c: "text-bad" },
            { v: <Counter to={47} delay={1.7} />, l: "Regular customers inactive", c: "text-navy-900" },
            { v: <>↓ <Counter to={18} delay={1.9} suffix="%" /></>, l: "Evening transactions", c: "text-bad" },
          ].map((m, i) => (
            <motion.div key={m.l} {...pop(1.4 + i * 0.18)} className="rounded-2xl bg-white p-3 shadow-card">
              <p className={cn("text-[26px] font-extrabold leading-none", m.c)}>{m.v}</p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{m.l}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "It recommends one action",
    stage: "PLANNING",
    ms: 4000,
    render: () => (
      <div className="space-y-3">
        <GallaBubble>Sales 11% kadime aagide. Main reason: nimma 47 regular customers last 14 days alli purchase maadilla.</GallaBubble>
        <GallaBubble delay={0.7}>
          I can create a <b>₹50 win-back campaign</b> for these 47 customers.
          <span className="mt-2 flex">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[12px] font-bold text-sky-700 ring-1 ring-sky-100">SEE PLAN →</span>
          </span>
        </GallaBubble>
      </div>
    ),
  },
  { label: "You ask what-if", stage: "LISTENING", ms: 3200, render: () => <MerchantBubble text="₹50 offer kotre enagutte?" /> },
  {
    label: "It simulates the outcome",
    stage: "PREDICTING",
    ms: 5000,
    render: () => (
      <motion.div {...pop(0)} className="ml-10 rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-ink">₹50 win-back · 47 customers</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-sky-600/60 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
            <FlaskConical className="size-3" aria-hidden /> Simulated estimate
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-canvas p-3">
            <p className="text-[12px] text-muted">Returning customers</p>
            <p className="text-[26px] font-extrabold text-ink">8–12</p>
            <div className="relative mt-2 h-2 rounded-full bg-white">
              <motion.div className="absolute inset-y-0 rounded-full bg-series-1" initial={{ left: "0%", width: "0%" }} animate={{ left: `${(8 / 47) * 100}%`, width: `${(4 / 47) * 100}%` }} transition={{ delay: 0.6, duration: 1 }} />
            </div>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <p className="text-[12px] text-muted">Incremental sales</p>
            <p className="text-[21px] font-extrabold text-ink">₹4,200–₹6,300</p>
            <p className="mt-1 text-[12px] font-bold text-good">Estimated ROI ~2.5×</p>
          </div>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-3 text-[12.5px] text-muted">
          Assumes ₹525 avg basket · 24% margin · ₹100 would bring back only ~1 more.
        </motion.p>
      </motion.div>
    ),
  },
  {
    label: "You approve",
    stage: "WAITING FOR APPROVAL",
    ms: 3800,
    render: () => (
      <motion.div {...pop(0)} className="relative ml-10 rounded-2xl bg-white p-4 shadow-card ring-2 ring-sky/50">
        <span className="rounded-full bg-warn-50 px-2 py-0.5 text-[10.5px] font-bold uppercase text-warn">Waiting for your approval</span>
        <p className="mt-2 text-[15px] font-semibold text-ink">Galla wants to create a ₹50 win-back campaign for 47 customers.</p>
        <div className="mt-3 flex gap-2">
          <motion.span initial={{ backgroundColor: "#0b8a4c" }} animate={{ scale: [1, 1, 0.94, 1] }} transition={{ delay: 1.7, duration: 0.35, times: [0, 0.2, 0.5, 1] }} className="relative flex h-11 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl text-[14px] font-extrabold text-white" style={{ backgroundColor: "#0b8a4c" }}>
            <Check className="size-4" aria-hidden /> APPROVE
            <motion.span className="absolute size-10 rounded-full bg-white/40" initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 6, opacity: 0 }} transition={{ delay: 1.85, duration: 0.7 }} />
          </motion.span>
          <span className="flex h-11 items-center rounded-xl px-4 text-[13px] font-bold text-navy ring-1 ring-line">EDIT</span>
          <span className="flex h-11 items-center px-3 text-[13px] font-bold text-navy">CANCEL</span>
        </div>
        <motion.svg viewBox="0 0 24 24" className="absolute size-7 drop-shadow-lg" initial={{ left: "85%", top: "110%", opacity: 0 }} animate={{ left: "28%", top: "72%", opacity: 1 }} transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }} aria-hidden>
          <path d="M5 3l14 8-6 1.5L10 19z" fill="#0b1a33" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </motion.svg>
      </motion.div>
    ),
  },
  {
    label: "Galla acts",
    stage: "EXECUTING",
    ms: 3800,
    render: () => (
      <div className="space-y-3">
        <motion.div {...pop(0)} className="ml-10 flex items-center gap-2 rounded-2xl bg-good-50 px-4 py-3 text-[15px] font-semibold text-ink">
          <CircleCheck className="size-5 text-good" aria-hidden /> Campaign created for 47 customers.
        </motion.div>
        <motion.div {...pop(0.4)} className="ml-10 rounded-2xl bg-white p-4 shadow-card">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Sending via WhatsApp + SMS</span>
            <span className="font-bold text-ink">
              <Counter to={47} delay={0.6} /> / 47
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
            <motion.div className="h-full rounded-full bg-series-1" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.6, duration: 1.3 }} />
          </div>
          <p className="mt-2 rounded-xl bg-[#e7f8ee] px-3 py-2 text-[13px] text-ink">Namaskara! Shree Lakshmi Stores misses you. Get ₹50 off on your next bill above ₹300.</p>
        </motion.div>
      </div>
    ),
  },
  {
    label: "It tracks the result",
    stage: "TRACKING",
    ms: 5000,
    render: () => (
      <motion.div {...pop(0)} className="ml-10 rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-ink">₹50 win-back · inactive regulars</p>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10.5px] font-bold text-sky-700">Day 7 / 7</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl bg-canvas p-3">
            <p className="text-[28px] font-extrabold text-good">
              +<Counter to={14} delay={0.3} />
            </p>
            <p className="text-[11.5px] text-muted">Customers returning</p>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <p className="text-[22px] font-extrabold text-ink">
              <Counter to={5800} prefix="₹" delay={0.4} />
            </p>
            <p className="text-[11.5px] text-muted">Incremental sales</p>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <p className="text-[28px] font-extrabold text-ink">
              <Counter to={2.8} decimals={1} suffix="×" delay={0.5} />
            </p>
            <p className="text-[11.5px] text-muted">Campaign ROI</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {[
            ["Sent", 47],
            ["Opened", 38],
            ["Returned", 14],
          ].map(([l, v], i) => (
            <li key={l} className="grid grid-cols-[64px_1fr_28px] items-center gap-2 text-[12px]">
              <span className="text-muted">{l}</span>
              <span className="h-2 rounded-full bg-canvas">
                <motion.span className={cn("block h-full rounded-full", l === "Returned" ? "bg-good" : "bg-series-1")} initial={{ width: 0 }} animate={{ width: `${((v as number) / 47) * 100}%` }} transition={{ delay: 0.5 + i * 0.2, duration: 0.9 }} />
              </span>
              <span className="text-right font-bold text-ink">{v}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    ),
  },
  {
    label: "And learns",
    stage: "LEARNING",
    ms: 5400,
    render: () => (
      <motion.div {...pop(0)} className="ml-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#e5f7ee] to-white shadow-card">
        <div className="flex items-center gap-2.5 px-4 pt-4">
          <span className="grid size-9 place-items-center rounded-xl bg-good text-white">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <p className="text-[14px] font-extrabold tracking-wider text-good">LEARNING COMPLETE</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="rounded-xl bg-white p-3">
            <p className="text-[12px] text-muted">Expected</p>
            <p className="text-[22px] font-extrabold text-ink">+10 customers</p>
          </div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="rounded-xl bg-white p-3 ring-2 ring-good">
            <p className="text-[12px] text-muted">Actual</p>
            <p className="text-[22px] font-extrabold text-good">+14 customers</p>
          </motion.div>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="px-4 pb-4 text-[16px] font-semibold text-ink">
          “This campaign performed better than expected.”
        </motion.p>
      </motion.div>
    ),
  },
];

const TOTAL_MS = SCENES.reduce((s, x) => s + x.ms, 0);

export function ProductDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [done, setDone] = useState(false);
  const sfx = useSfx(muted);

  useEffect(() => {
    if (inView && !reduce) setPlaying(true);
  }, [inView, reduce]);

  useEffect(() => {
    sfx(index === 6 ? "tap" : index === 9 ? "chime" : "pop");
  }, [index, sfx]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      setElapsed((e) => e + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    if (elapsed < SCENES[index].ms) return;
    if (index < SCENES.length - 1) {
      setIndex((i) => i + 1);
      setElapsed(0);
    } else {
      setPlaying(false);
      setDone(true);
      setElapsed(SCENES[index].ms);
    }
  }, [elapsed, index]);

  const jump = (i: number) => {
    setIndex(i);
    setElapsed(0);
    setDone(false);
  };
  const replay = () => {
    jump(0);
    setPlaying(true);
  };
  const toggle = () => {
    if (done) replay();
    else setPlaying((p) => !p);
  };
  const skip = () => (index < SCENES.length - 1 ? jump(index + 1) : setDone(true));

  const doneMs = SCENES.slice(0, index).reduce((s, x) => s + x.ms, 0) + Math.min(elapsed, SCENES[index].ms);
  const fmt = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, "0")}`;
  const scene = SCENES[index];

  return (
    <section id="demo" className="scroll-mt-16 overflow-hidden bg-gradient-to-b from-deep via-deep-2 to-deep px-5 py-24 text-white sm:py-32" aria-labelledby="demo-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow dark>See how Galla works</Eyebrow>
          <div id="demo-title" className="mt-4">
            <Headline dark lines={["Sales dropped.", "Galla fixed it in 90 seconds."]} className="text-[clamp(32px,5vw,62px)]" />
          </div>
        </div>

        <div ref={ref} className="mt-14 grid gap-8 lg:grid-cols-[280px_1fr]">
          <ol className="hidden space-y-1 lg:block" aria-label="Demo chapters">
            {SCENES.map((s, i) => (
              <li key={s.label}>
                <button type="button" onClick={() => jump(i)} aria-current={i === index ? "step" : undefined} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", i === index ? "bg-white/10" : "hover:bg-white/5")}>
                  <span className={cn("text-[12px] font-extrabold tabular-nums", i === index ? "text-sky" : i < index ? "text-white/60" : "text-white/30")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={cn("text-[15px] font-semibold", i === index ? "text-white" : i < index ? "text-white/60" : "text-white/40")}>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div>
            <div className="relative overflow-hidden rounded-[28px] bg-canvas text-ink shadow-[0_60px_120px_-40px_rgba(44,197,201,0.45)] ring-1 ring-white/10">
              <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3.5">
                <GallaMark size={30} animated={playing} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold tracking-wide text-navy">ASK GALLA · Shree Lakshmi Stores</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={scene.stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700">
                      {scene.stage}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <span className="hidden rounded-full bg-canvas px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-muted sm:inline">Demo data</span>
              </div>
              <div className="relative h-[430px] px-4 py-6 sm:h-[400px] sm:px-8" aria-live="polite">
                <p className="sr-only">
                  Step {index + 1} of {SCENES.length}: {scene.label}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="mx-auto max-w-2xl">
                    {scene.render()}
                  </motion.div>
                </AnimatePresence>
                <AnimatePresence>
                  {done && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/92 px-6 text-center text-white backdrop-blur">
                      <p className="text-[clamp(28px,4vw,44px)] font-extrabold uppercase leading-[1] tracking-tight">
                        You say it.
                        <br />
                        <span className="text-sky">AI gets it done.</span>
                      </p>
                      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={replay} className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-bold uppercase tracking-wider ring-1 ring-white/30 hover:bg-white/10">
                          <RotateCcw className="size-4" aria-hidden /> Replay
                        </button>
                        <Link href="/demo" className="inline-flex h-11 items-center justify-center rounded-full bg-sky px-5 text-[13px] font-extrabold uppercase tracking-wider text-navy-900 hover:bg-white">
                          Run it in the live app
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3" role="group" aria-label="Demo controls">
              <button type="button" onClick={toggle} aria-label={done ? "Replay demo" : playing ? "Pause demo" : "Play demo"} className="grid size-12 place-items-center rounded-full bg-sky text-navy-900 hover:bg-white">
                {done ? <RotateCcw className="size-5" /> : playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-0.5" fill="currentColor" />}
              </button>
              <button type="button" onClick={replay} aria-label="Replay from start" className="grid size-10 place-items-center rounded-full text-white ring-1 ring-white/20 hover:bg-white/10">
                <RotateCcw className="size-4" />
              </button>
              <button type="button" onClick={skip} aria-label="Skip to next step" className="grid size-10 place-items-center rounded-full text-white ring-1 ring-white/20 hover:bg-white/10">
                <SkipForward className="size-4" />
              </button>
              <button type="button" onClick={() => setMuted((m) => !m)} aria-pressed={!muted} aria-label={muted ? "Unmute sound effects" : "Mute sound effects"} className="grid size-10 place-items-center rounded-full text-white ring-1 ring-white/20 hover:bg-white/10">
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <div className="flex min-w-[200px] flex-1 items-center gap-1" aria-label="Progress">
                {SCENES.map((s, i) => (
                  <button key={s.label} type="button" onClick={() => jump(i)} aria-label={`Go to step ${i + 1}: ${s.label}`} className="group flex h-8 flex-1 items-center">
                    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/15 group-hover:bg-white/25">
                      <span className="block h-full rounded-full bg-sky" style={{ width: `${i < index || done ? 100 : i === index ? Math.min(100, (elapsed / s.ms) * 100) : 0}%` }} />
                    </span>
                  </button>
                ))}
              </div>
              <span className="tabular text-[12.5px] font-semibold text-white/60">
                {fmt(doneMs)} / {fmt(TOTAL_MS)}
              </span>
            </div>
            <p className="mt-2 text-[13px] text-white/50 lg:hidden">
              {index + 1}/{SCENES.length} · {scene.label}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
