"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import { Eyebrow, Headline } from "./primitives";

const LANGS = [
  { key: "kanglish", label: "Kanglish", q: "Nanna sales ee vaara yaake kadime aagide?", a: "Sales 11% kadime aagide. Main reason: nimma 47 regular customers last 14 days alli purchase maadilla." },
  { key: "kannada", label: "Kannada", q: "ನನ್ನ ಸೇಲ್ಸ್ ಈ ವಾರ ಯಾಕೆ ಕಡಿಮೆ ಆಗಿದೆ?", a: "ಸೇಲ್ಸ್ 11% ಕಡಿಮೆ ಆಗಿದೆ. ನಿಮ್ಮ 47 ರೆಗ್ಯುಲರ್ ಗ್ರಾಹಕರು 14 ದಿನಗಳಿಂದ ಖರೀದಿ ಮಾಡಿಲ್ಲ." },
  { key: "hinglish", label: "Hinglish", q: "Mere sales is hafte kyun kam hue?", a: "Sales 11% kam hui hai. Aapke 47 regular customers ne 14 din se kuch nahi khareeda." },
  { key: "hindi", label: "Hindi", q: "मेरी बिक्री इस हफ्ते क्यों कम हुई?", a: "बिक्री 11% कम हुई है। आपके 47 नियमित ग्राहकों ने 14 दिनों से खरीदारी नहीं की।" },
  { key: "english", label: "English", q: "Why are my sales down this week?", a: "Sales are down 11%. 47 regular customers haven't purchased in 14 days." },
];

const PHASES = ["Listening", "Understanding", "Analyzing", "Answer"] as const;
const PHASE_MS = [1800, 1300, 1300, 4200];

export function VoiceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [lang, setLang] = useState(0);
  const [phase, setPhase] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [typed, setTyped] = useState(0);
  const l = LANGS[lang];

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => {
      if (phase < PHASES.length - 1) setPhase(phase + 1);
      else {
        setPhase(0);
        if (!pinned) setLang((x) => (x + 1) % LANGS.length);
      }
    }, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, inView, pinned]);

  useEffect(() => {
    setTyped(0);
    if (phase !== 0) {
      setTyped(l.q.length);
      return;
    }
    const id = setInterval(() => setTyped((n) => (n >= l.q.length ? n : n + 1)), 1500 / l.q.length);
    return () => clearInterval(id);
  }, [phase, lang, l.q.length]);

  return (
    <section className="bg-white px-5 py-24 sm:py-32" aria-labelledby="voice-title">
      <div ref={ref} className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div>
          <Eyebrow>Voice-first</Eyebrow>
          <div id="voice-title" className="mt-4">
            <Headline lines={["Just talk", "to Galla."]} className="text-[clamp(40px,6.4vw,84px)]" />
          </div>
          <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-muted">No menus, no reports. Speak the way you speak at the counter — Galla understands English, Hindi, Hinglish, Kannada and Kanglish, and answers in kind.</p>
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Languages">
            {LANGS.map((x, i) => (
              <button
                key={x.key}
                type="button"
                aria-pressed={i === lang}
                onClick={() => {
                  setLang(i);
                  setPhase(0);
                  setPinned(true);
                }}
                className={cn("h-11 rounded-full px-4 text-[14px] font-bold ring-1 transition-colors", i === lang ? "bg-navy text-white ring-navy" : "text-navy ring-line hover:ring-navy/40")}
              >
                {x.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-faint">Live speech uses Sarvam AI (Indian-language STT & TTS) when configured.</p>
        </div>

        <div className="relative rounded-[32px] bg-gradient-to-b from-navy-900 to-navy p-7 text-white shadow-float sm:p-10">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5" aria-hidden>
            {PHASES.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider transition-colors", i === phase ? "bg-sky text-navy-900" : i < phase ? "text-sky" : "text-white/35")}>{p}</span>
                {i < PHASES.length - 1 && <span className="text-white/25">→</span>}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center">
            <div className={cn("relative grid size-24 place-items-center rounded-full bg-sky text-navy-900", phase === 0 && "animate-ring")}>
              <Mic className="size-10" aria-hidden />
            </div>
            <div className="mt-6 flex h-10 items-center gap-1" aria-hidden>
              {Array.from({ length: 22 }, (_, i) => (
                <span key={i} className={cn("w-1 rounded-full bg-sky/80", phase === 0 && "animate-wave")} style={{ height: phase === 0 ? `${12 + ((i * 29) % 26)}px` : "5px", animationDelay: `${(i % 7) * 0.08}s`, transition: "height .3s" }} />
              ))}
            </div>
            <p className="mt-5 min-h-[60px] text-center text-[20px] font-semibold leading-snug" lang={l.key === "kannada" ? "kn" : l.key === "hindi" ? "hi" : "en"}>
              “{l.q.slice(0, typed)}”
            </p>
          </div>

          <div className="mt-4 min-h-[112px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {phase === 3 && (
                <motion.div key={l.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3 rounded-2xl bg-white p-4 text-ink">
                  <GallaMark size={30} />
                  <p className="text-[15px] leading-relaxed" lang={l.key === "kannada" ? "kn" : l.key === "hindi" ? "hi" : "en"}>
                    {l.a}
                  </p>
                </motion.div>
              )}
              {(phase === 1 || phase === 2) && (
                <motion.p key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-[14px] text-white/70">
                  {phase === 1 ? `Language: ${l.label} · intent: sales decline` : "Checking 1,248 payments and 684 customers…"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
