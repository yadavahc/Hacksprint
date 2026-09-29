"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, Package, ShieldAlert, TrendingDown, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { Eyebrow } from "./primitives";

const SIGNALS = [
  { icon: TrendingDown, title: "Sales ↓", sub: "Down this week — but why?", x: -380, y: -170, r: -9 },
  { icon: UserX, title: "Customers becoming inactive", sub: "Some regulars stopped coming", x: 360, y: -150, r: 7 },
  { icon: Package, title: "Inventory running low", sub: "Which item? When?", x: -330, y: 150, r: 6 },
  { icon: CalendarClock, title: "Payments due", sub: "Rent, supplier, EMI…", x: 350, y: 160, r: -6 },
  { icon: ShieldAlert, title: "Suspicious beneficiary", sub: "New payee asking for ₹35,700", x: 0, y: 250, r: 3 },
];

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** 0 = scattered signals, 1 = signals converging, 2 = Galla's single prioritised summary. */
type Stage = 0 | 1 | 2;

function GallaAttention({ visible = true }: { visible?: boolean }) {
  const items = [
    { n: 1, t: "47 regular customers haven't purchased in 14 days", d: "Main reason sales fell 11% · win-back ready", tone: "bg-[#ff6b6b]" },
    { n: 2, t: "Parle-G may run out in 3 days", d: "Order prepared for Sri Manjunatha Agencies", tone: "bg-[#f5a524]" },
    { n: 3, t: "This beneficiary looks unusual", d: "New payee · 4.2× your usual supplier payment", tone: "bg-[#f5a524]" },
  ];
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 40, scale: visible ? 1 : 0.96 }}
      transition={{ duration: 0.7, delay: visible ? 0.25 : 0, ease: EASE }}
      className="relative mx-auto w-full max-w-[440px] rounded-3xl bg-white p-5 text-left text-ink shadow-[0_40px_80px_-30px_rgba(44,197,201,0.5)]"
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2.5">
        <GallaMark size={34} />
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-sky-700">GALLA</p>
          <p className="text-[17px] font-bold leading-tight text-navy-900">Here&apos;s what needs your attention.</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((it) => (
          <li key={it.n} className="flex gap-3 rounded-2xl bg-canvas p-3">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white ${it.tone}`}>{it.n}</span>
            <span>
              <span className="block text-[14px] font-semibold leading-snug">{it.t}</span>
              <span className="block text-[12px] text-muted">{it.d}</span>
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function ProblemSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState<Stage>(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, window.innerWidth / 1080) * (window.innerWidth < 640 ? 0.62 : 1));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Measure progress through the tall section directly so the story is deterministic on every browser.
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      const p = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
      setStage(p < 0.28 ? 0 : p < 0.58 ? 1 : 2);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const heading = (
    <>
      <Eyebrow dark>The problem</Eyebrow>
      <h2 className="mt-4 text-balance text-[clamp(30px,5.2vw,64px)] font-extrabold uppercase leading-[0.98] tracking-[-0.02em] text-white">
        Your payments tell you what happened.
        <span className="block text-sky">But not what to do next.</span>
      </h2>
    </>
  );

  if (reduce) {
    return (
      <section className="bg-deep-2 px-5 py-24 text-center" aria-label="The problem">
        <div className="mx-auto max-w-5xl">{heading}</div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
          {SIGNALS.map((s) => (
            <span key={s.title} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white">
              {s.title}
            </span>
          ))}
        </div>
        <div className="mt-10">
          <GallaAttention />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[260vh] bg-deep-2" aria-label="The problem">
      <div className="sticky top-0 flex h-screen flex-col items-center overflow-hidden px-5 pt-24 text-center">
        <motion.div initial={false} animate={{ opacity: stage === 2 ? 0.4 : 1 }} transition={{ duration: 0.6 }} className="mx-auto max-w-5xl">
          {heading}
          <motion.p initial={false} animate={{ opacity: stage === 1 ? 1 : 0 }} transition={{ duration: 0.4 }} className="mt-4 text-[15px] font-semibold text-white/60" aria-hidden={stage !== 1}>
            Disconnected signals. No one connecting them.
          </motion.p>
        </motion.div>
        <div className="relative w-full flex-1">
          {SIGNALS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={false}
              animate={
                stage === 0
                  ? { x: s.x * scale, y: s.y * scale, rotate: s.r, opacity: 1, scale: 1 }
                  : stage === 1
                    ? { x: 0, y: 18 + i * 7, rotate: 0, opacity: 1, scale: 0.82 }
                    : { x: 0, y: 30, rotate: 0, opacity: 0, scale: 0.6 }
              }
              transition={{ duration: 0.75, delay: stage === 1 ? i * 0.06 : 0, ease: EASE }}
              className="absolute left-1/2 top-1/2 -ml-[130px] -mt-[36px] flex w-[260px] items-center gap-3 rounded-2xl bg-white/[0.07] p-3.5 text-left ring-1 ring-white/12 backdrop-blur"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                <s.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-white">{s.title}</span>
                <span className="block text-[12px] text-white/55">{s.sub}</span>
              </span>
            </motion.div>
          ))}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
            <GallaAttention visible={stage === 2} />
          </div>
        </div>
      </div>
    </section>
  );
}
