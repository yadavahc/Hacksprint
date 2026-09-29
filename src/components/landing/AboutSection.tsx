"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Brain, Eye, GraduationCap, ShieldCheck, Target, Zap } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline, Reveal } from "./primitives";

const EXPLAINS = ["What changed", "Why it changed", "What might happen next", "What you can do", "What the result could be"];

const LOOP = [
  { k: "Understand", icon: Eye, d: "Sales fell 11% because 47 regulars stopped visiting." },
  { k: "Predict", icon: Brain, d: "Parle-G runs out in 3 days. Your ₹7,500 EMI may fail." },
  { k: "Protect", icon: ShieldCheck, d: "A new payee wants 4.2× your usual supplier payment." },
  { k: "Decide", icon: Target, d: "₹50 win-back beats a ₹100 store-wide discount." },
  { k: "Act", icon: Zap, d: "You approve. Galla creates the campaign for 47 customers." },
  { k: "Learn", icon: GraduationCap, d: "14 came back vs 8–12 expected. Estimates get sharper." },
];

export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="bg-[#f4f8fc] px-5 py-24 sm:py-32" aria-labelledby="about-title">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div>
          <Eyebrow>About Galla</Eyebrow>
          <div id="about-title" className="mt-4">
            <Headline lines={["Your business already has the data.", "Galla knows what to do with it."]} className="text-[clamp(30px,4.6vw,56px)]" />
          </div>
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted">
              Galla connects the signals your business already creates — payments, customers, inventory, invoices and cashflow — and turns them into decisions and actions. No dashboards to decode. Galla tells you, proactively:
            </p>
          </Reveal>
          <ul className="mt-6 space-y-2.5">
            {EXPLAINS.map((e, i) => (
              <Reveal key={e} delay={0.25 + i * 0.07}>
                <li className="flex items-center gap-3 text-[17px] font-semibold text-navy-900">
                  <span className="grid size-7 place-items-center rounded-full bg-sky-100 text-[12px] font-extrabold text-sky-700">{i + 1}</span>
                  {e}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div ref={ref} className="relative pl-10">
          <div className="absolute bottom-3 left-[15px] top-3 w-[3px] rounded-full bg-line" aria-hidden />
          <motion.div className="absolute left-[15px] top-3 w-[3px] origin-top rounded-full bg-gradient-to-b from-sky to-navy" style={{ scaleY: fill, bottom: 12 }} aria-hidden />
          <p className="mb-6 text-[12px] font-extrabold uppercase tracking-[0.22em] text-muted">The Galla loop</p>
          <ol className="space-y-5">
            {LOOP.map((s, i) => (
              <motion.li
                key={s.k}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-35% 0px -35% 0px" }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <span className={cn("absolute -left-10 top-1 grid size-8 place-items-center rounded-full bg-white text-navy shadow-card ring-2 ring-sky/40")}>
                  <s.icon className="size-4" aria-hidden />
                </span>
                <p className="text-[clamp(24px,3vw,34px)] font-extrabold uppercase leading-none tracking-tight text-navy-900">
                  {s.k}
                  {i < LOOP.length - 1 && <span className="ml-2 text-sky">↓</span>}
                </p>
                <p className="mt-1.5 text-[15px] text-muted">{s.d}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
