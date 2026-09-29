"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Landmark, Mic, Package, ShieldCheck, Store, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline } from "./primitives";

const CAPS = [
  { key: "udhaar", name: "Udhaar Recovery", icon: BookOpen, line: "Voice khata, AI recovery calls, trust scores.", u: "“Ramesh 450 udhaar, Friday tak” — logged, receipt sent.", p: "Lakshmi is 4 days overdue · AMBER trust, safe limit ₹1,000.", a: "Consent-based AI call in Kannada, then a UPI pay-link on WhatsApp.", prompt: "Ramesh 450 udhaar, Friday tak" },
  { key: "growth", name: "Growth", primary: true, icon: TrendingUp, line: "Customers, sales and campaigns.", u: "Sales fell 11% because 47 regulars stopped visiting.", p: "A ₹50 win-back likely brings back 8–12 of them.", a: "Creates the campaign after you approve — then tracks ROI.", prompt: "Nanna sales ee vaara yaake kadime aagide?" },
  { key: "inventory", name: "Inventory", icon: Package, line: "Stock prediction and procurement.", u: "Parle-G sells about 18 packets a day.", p: "It will likely run out in 3 days.", a: "Prepares a supplier order, sized by the case.", prompt: "Stock yaavaga mugiyutte?" },
  { key: "cashflow", name: "Cashflow", icon: Wallet, line: "Available vs committed money.", u: "₹61,300 in the bank — ₹18,500 already promised.", p: "Your ₹7,500 EMI may fail in 3 days.", a: "Sets a reminder to top up. Never moves money itself.", prompt: "Nijavaagi eshtu hana available ide?" },
  { key: "safety", name: "Safety", icon: ShieldCheck, line: "QR and beneficiary risk.", u: "New payee, name mismatch, 4.2× your usual amount.", p: "HIGH risk across 9 explainable signals.", a: "Pauses the transfer until you decide.", prompt: "Ee QR safe aa?" },
  { key: "credit", name: "Credit Readiness", icon: Landmark, line: "Business readiness insights.", u: "11 of 12 months above ₹1.5L in sales.", p: "ALMOST READY — GST returns are missing.", a: "Tells you exactly what to upload. Lenders decide.", prompt: "Loan-ge ready iddina?" },
  { key: "digital", name: "Digitalization", icon: Store, line: "Offline inventory to a digital catalog.", u: "“Ee biscuit packet ₹10, 25 pieces ide.”", p: "Name, price and stock extracted.", a: "Creates the item on your digital storefront.", prompt: "Ee biscuit packet ₹10, 25 pieces ide." },
  { key: "voice", name: "Voice", icon: Mic, line: "Talk naturally in Indian languages.", u: "Kannada, Kanglish, Hindi, Hinglish or English.", p: "Detects intent and language from speech.", a: "Answers in your language — text or voice.", prompt: "Mere sales is hafte kyun kam hue?" },
];

export function CapabilitiesSection() {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched) return;
    const id = setInterval(() => setActive((a) => (a + 1) % CAPS.length), 4500);
    return () => clearInterval(id);
  }, [touched]);
  const select = (i: number) => {
    setTouched(true);
    setActive(i);
  };
  const cap = CAPS[active];

  return (
    <section id="capabilities" className="scroll-mt-16 bg-deep px-5 py-24 text-white sm:py-32" aria-labelledby="caps-title">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <Eyebrow dark>Supporting intelligence</Eyebrow>
          <div id="caps-title" className="mt-4">
            <Headline dark lines={["One Galla brain.", "Every part of your business."]} className="text-[clamp(32px,5vw,62px)]" />
          </div>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[440px_1fr]">
          <div className="relative mx-auto hidden aspect-square w-full max-w-[440px] lg:block">
            <svg viewBox="0 0 440 440" className="absolute inset-0" aria-hidden>
              <circle cx="220" cy="220" r="160" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 6" />
              {CAPS.map((c, i) => {
                const ang = (-90 + (i * 360) / CAPS.length) * (Math.PI / 180);
                const x = 220 + 160 * Math.cos(ang);
                const y = 220 + 160 * Math.sin(ang);
                return <line key={c.key} x1="220" y1="220" x2={x} y2={y} stroke={i === active ? "#2cc5c9" : "rgba(255,255,255,0.1)"} strokeWidth={i === active ? 2 : 1} strokeDasharray={i === active ? "6 6" : undefined} style={i === active ? { animation: "var(--animate-dash)" } : undefined} />;
              })}
            </svg>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
              <GallaMark size={72} animated />
              <span className="relative z-10 rounded-md bg-deep px-2 py-0.5 text-[12px] font-extrabold tracking-[0.2em] text-sky">GALLA</span>
            </div>
            {CAPS.map((c, i) => {
              const ang = (-90 + (i * 360) / CAPS.length) * (Math.PI / 180);
              const left = 50 + (160 / 440) * 100 * Math.cos(ang);
              const top = 50 + (160 / 440) * 100 * Math.sin(ang);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => select(i)}
                  aria-pressed={i === active}
                  className={cn("absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl px-2 py-2 transition-colors", i === active ? "text-white" : "text-white/55 hover:text-white")}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <span className={cn("grid size-12 place-items-center rounded-2xl ring-1 transition-all", i === active ? "scale-110 bg-sky text-navy-900 ring-sky" : "bg-white/[0.06] ring-white/15")}>
                    <c.icon className="size-5" aria-hidden />
                  </span>
                  <span className="whitespace-nowrap text-[12px] font-bold">{c.name}</span>
                </button>
              );
            })}
          </div>

          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:hidden" role="group" aria-label="Capabilities">
            {CAPS.map((c, i) => (
              <button key={c.key} type="button" onClick={() => select(i)} aria-pressed={i === active} className={cn("flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-bold ring-1", i === active ? "bg-sky text-navy-900 ring-sky" : "text-white/75 ring-white/20")}>
                <c.icon className="size-4" aria-hidden />
                {c.name}
              </button>
            ))}
          </div>

          <div className="relative min-h-[380px]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={cap.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.4 }} className="rounded-3xl bg-white/[0.05] p-7 ring-1 ring-white/10 sm:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-sky text-navy-900">
                    <cap.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-[30px] font-extrabold uppercase tracking-tight">{cap.name}</h3>
                  {cap.primary && <span className="rounded-full bg-good px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">Primary</span>}
                </div>
                <p className="mt-2 text-[17px] text-white/70">{cap.line}</p>
                <dl className="mt-7 space-y-4">
                  {[
                    ["Understand", cap.u],
                    ["Predict", cap.p],
                    ["Act", cap.a],
                  ].map(([k, v], i) => (
                    <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="grid grid-cols-[110px_1fr] items-baseline gap-4 border-t border-white/10 pt-4">
                      <dt className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-sky">{k}</dt>
                      <dd className="text-[17px] font-semibold leading-snug text-white">{v}</dd>
                    </motion.div>
                  ))}
                </dl>
                <p className="mt-7 inline-flex rounded-full bg-white/[0.08] px-4 py-2 text-[14px] text-white/85">“{cap.prompt}”</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
