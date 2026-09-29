"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleAlert, CircleCheck, Info, Mic } from "lucide-react";
import type { ReactNode } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import { useGalla } from "@/lib/store/provider";
import type { ScreenName } from "@/lib/store/types";

export function ScreenHeader({ title, subtitle, back = true, parent = "business", right }: { title: string; subtitle?: string; back?: boolean; parent?: ScreenName; right?: ReactNode }) {
  const { state, back: goBack, navigate } = useGalla();
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-3">
      {back && (
        <button type="button" onClick={() => (state.stack.length ? goBack() : navigate(parent))} aria-label="Back" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white">
          <ArrowLeft className="size-5 text-navy" />
        </button>
      )}
      <div className={cn("min-w-0 flex-1", !back && "pl-1")}>
        <h1 className="truncate text-[19px] font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function AskGallaBar({ placeholder = "Tell Galla what you need" }: { placeholder?: string }) {
  const { navigate, setVoiceOpen } = useGalla();
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 pl-3 shadow-card">
      <GallaMark size={26} />
      <button
        type="button"
        onClick={() => {
          navigate("galla");
          setTimeout(() => document.getElementById("galla-input")?.focus(), 350);
        }}
        className="min-h-10 flex-1 text-left text-sm text-faint"
      >
        {placeholder}
      </button>
      <button type="button" onClick={() => setVoiceOpen(true)} aria-label="Speak to Galla" className="grid size-10 place-items-center rounded-xl bg-navy text-white hover:bg-navy-700">
        <Mic className="size-5" />
      </button>
    </div>
  );
}

export function Toasts() {
  const { state, dispatch } = useGalla();
  return (
    <div className="pointer-events-none absolute inset-x-3 top-16 z-30 flex flex-col items-center gap-2" aria-live="polite">
      <AnimatePresence>
        {state.toasts.map((t) => {
          const Icon = t.tone === "good" ? CircleCheck : t.tone === "bad" ? CircleAlert : Info;
          return (
            <motion.button
              type="button"
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={() => dispatch({ type: "DISMISS_TOAST", id: t.id })}
              className="pointer-events-auto flex max-w-full items-start gap-2 rounded-2xl bg-ink px-3.5 py-2.5 text-left text-[13px] font-medium text-white shadow-float"
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", t.tone === "good" ? "text-[#5fe0a0]" : t.tone === "bad" ? "text-[#ff8a8a]" : "text-sky")} aria-hidden />
              <span>{t.text}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function DemoFooter() {
  return <p className="px-6 pb-4 pt-2 text-center text-[11px] text-faint">GALLA · HackSprint prototype · Demo data · No real payments</p>;
}
