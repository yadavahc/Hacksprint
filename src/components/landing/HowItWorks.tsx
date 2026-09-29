"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { BadgeCheck, ChartLine, Cpu, Database, FlaskConical, GraduationCap, Lightbulb, Mic, ScanSearch, Zap } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline } from "./primitives";

const STEPS = [
  { t: "Merchant speaks or types", d: "“Nanna sales ee vaara yaake kadime aagide?” — voice or text, in their own language.", icon: Mic, chip: "🎙️ Kanglish" },
  { t: "Galla understands intent", d: "Detects the language and what's really being asked: a sales diagnosis.", icon: ScanSearch, chip: "intent: sales decline · 92%" },
  { t: "Galla checks business data", d: "1,248 payments, 684 customers, 32 products, cash and obligations.", icon: Database, chip: "1,248 payments scanned" },
  { t: "The right agent works", d: "The Growth Agent takes over. Calculations are deterministic — never guessed.", icon: Cpu, chip: "Growth Agent" },
  { t: "Galla explains the insight", d: "Sales −11% because 47 regulars stopped visiting. Evidence attached.", icon: Lightbulb, chip: "Why Galla thinks this" },
  { t: "What-if simulation", d: "A ₹50 offer → 8–12 customers likely return · ₹4,200–₹6,300.", icon: FlaskConical, chip: "Simulated estimate" },
  { t: "Merchant approves", d: "Nothing changes without a tap. Edit or cancel any time.", icon: BadgeCheck, chip: "APPROVE" },
  { t: "Action executes", d: "Campaign created for 47 customers via WhatsApp + SMS.", icon: Zap, chip: "Campaign live" },
  { t: "Outcome is tracked", d: "+14 customers back · ₹5,800 incremental sales · ROI 2.8×.", icon: ChartLine, chip: "+14 · ₹5,800 · 2.8×" },
  { t: "Galla learns", d: "Better than expected — future estimates are recalibrated.", icon: GraduationCap, chip: "Learning complete" },
];

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how" className="scroll-mt-16 bg-deep px-5 py-24 text-white sm:py-32" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow dark>How Galla works</Eyebrow>
          <div id="how-title" className="mt-4">
            <Headline dark lines={["From one sentence", "to a finished action."]} className="text-[clamp(32px,5vw,62px)]" />
          </div>
        </div>

        <ol ref={ref} className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute bottom-0 left-[19px] top-0 w-[2px] bg-white/10 md:left-1/2 md:-ml-px" aria-hidden />
          <motion.div className="absolute bottom-0 left-[19px] top-0 w-[2px] origin-top bg-gradient-to-b from-sky via-sky to-[#8ceae8] md:left-1/2 md:-ml-px" style={{ scaleY }} aria-hidden />
          {STEPS.map((s, i) => {
            const right = i % 2 === 1;
            return (
              <li key={s.t} className={cn("relative mb-8 pl-14 md:mb-10 md:w-1/2 md:pl-0", right ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right")}>
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-30% 0px" }}
                  className={cn("absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-deep ring-2 ring-sky md:top-1", right ? "md:-left-5" : "md:left-auto md:-right-5")}
                >
                  <s.icon className="size-[18px] text-sky" aria-hidden />
                </motion.span>
                <motion.div initial={{ opacity: 0, x: right ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-25% 0px" }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}>
                  <p className="text-[12px] font-extrabold tracking-[0.2em] text-white/40">STEP {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-[22px] font-extrabold leading-tight">{s.t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-white/65">{s.d}</p>
                  <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-[12px] font-bold", i === 6 ? "bg-good text-white" : i === 5 ? "border border-dashed border-sky/60 text-sky" : "bg-white/[0.08] text-white/85")}>{s.chip}</span>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
