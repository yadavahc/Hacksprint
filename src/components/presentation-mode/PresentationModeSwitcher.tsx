"use client";

import { motion } from "framer-motion";
import { RectangleVertical, Smartphone } from "lucide-react";
import { useId } from "react";
import { cn } from "@/components/ui/primitives";
import { usePresentationMode, type PresentationMode } from "./PresentationModeContext";

const OPTIONS: { value: PresentationMode; label: string; icon: typeof Smartphone }[] = [
  { value: "phone", label: "Phone", icon: Smartphone },
  { value: "normal", label: "Normal", icon: RectangleVertical },
];

export function PresentationModeSwitcher({ dark = false }: { dark?: boolean }) {
  const { mode, setMode, isMobile } = usePresentationMode();
  // Each switcher needs its own layoutId; a shared one makes the pill jump between instances.
  const pillId = `presentation-pill-${useId()}`;
  if (isMobile) return null;
  return (
    <div role="radiogroup" aria-label="Presentation mode" className={cn("relative flex rounded-full p-1", dark ? "bg-white/10 ring-1 ring-white/15" : "bg-white ring-1 ring-line")}>
      {OPTIONS.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(o.value)}
            className={cn("relative z-10 flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors", active ? (dark ? "text-navy-900" : "text-white") : dark ? "text-white/75 hover:text-white" : "text-muted hover:text-ink")}
          >
            {active && <motion.span layoutId={pillId} className={cn("absolute inset-0 -z-10 rounded-full", dark ? "bg-white" : "bg-navy")} transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <o.icon className="size-4" aria-hidden />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
