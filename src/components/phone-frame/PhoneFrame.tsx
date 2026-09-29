"use client";

import { BatteryFull, SignalHigh, Wifi } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/components/ui/primitives";

export const PHONE = { screenW: 390, screenH: 844, bezel: 12, statusBar: 50 };

/**
 * A realistic smartphone presentation wrapper.
 *
 * IMPORTANT: the element tree is identical whether the frame is active or not — only classes and
 * decorative siblings change. That way the live application passed as `children` is never
 * unmounted when switching Phone ↔ Normal, so every piece of state (route, chat, scroll) survives.
 */
export function PhoneFrame({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative transition-[padding,border-radius,box-shadow,background-color] duration-300 ease-out",
        active ? "rounded-[58px] bg-gradient-to-b from-[#1d2433] via-[#0d1119] to-[#1a2030] p-3 shadow-device ring-1 ring-white/10" : "h-full w-full rounded-none p-0 sm:rounded-[28px]",
      )}
      style={active ? { width: PHONE.screenW + PHONE.bezel * 2, height: PHONE.screenH + PHONE.bezel * 2 } : undefined}
    >
      {/* Hardware buttons + edge highlight (decorative) */}
      <span aria-hidden className={cn("pointer-events-none absolute inset-0 rounded-[58px] transition-opacity", active ? "opacity-100" : "opacity-0")} style={{ boxShadow: "inset 0 0 0 1.5px rgb(255 255 255 / 0.08), inset 0 2px 1px rgb(255 255 255 / 0.12)" }} />
      <span aria-hidden className={cn("absolute -left-[3px] top-[150px] h-8 w-[3px] rounded-l bg-[#2a3142] transition-opacity", active ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn("absolute -left-[3px] top-[200px] h-14 w-[3px] rounded-l bg-[#2a3142] transition-opacity", active ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn("absolute -left-[3px] top-[268px] h-14 w-[3px] rounded-l bg-[#2a3142] transition-opacity", active ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn("absolute -right-[3px] top-[220px] h-20 w-[3px] rounded-r bg-[#2a3142] transition-opacity", active ? "opacity-100" : "opacity-0")} />

      <div
        className={cn("relative h-full w-full overflow-hidden bg-canvas transition-[border-radius] duration-300", active ? "rounded-[46px]" : "rounded-none sm:rounded-[28px] sm:ring-1 sm:ring-line")}
        style={{ ["--safe-bottom" as string]: active ? "14px" : "env(safe-area-inset-bottom, 0px)", ["--safe-top" as string]: active ? `${PHONE.statusBar}px` : "env(safe-area-inset-top, 0px)" } as CSSProperties}
      >
        {active && <StatusBar />}
        <div className="absolute inset-x-0 bottom-0 transition-[top] duration-300" style={{ top: active ? PHONE.statusBar : 0 }}>
          {children}
        </div>
        {active && <span aria-hidden className="pointer-events-none absolute left-1/2 top-[11px] z-50 h-[34px] w-[124px] -translate-x-1/2 rounded-full bg-black" />}
        {active && <span aria-hidden className="pointer-events-none absolute bottom-[7px] left-1/2 z-50 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink/80" />}
      </div>
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 z-40 flex items-center justify-between bg-white px-8 text-[15px] font-semibold text-ink" style={{ height: PHONE.statusBar }}>
      <span className="tabular pt-1">{time.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false })}</span>
      <span className="flex items-center gap-1.5 pt-1">
        <SignalHigh className="size-4" strokeWidth={2.5} />
        <Wifi className="size-4" strokeWidth={2.5} />
        <BatteryFull className="size-5" strokeWidth={2} />
      </span>
    </div>
  );
}
