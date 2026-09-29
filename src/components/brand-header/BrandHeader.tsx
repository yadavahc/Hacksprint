"use client";

import { Bell } from "lucide-react";
import { MERCHANT } from "@/lib/data/story";
import { useGalla } from "@/lib/store/provider";
import { BrandWordmark } from "./BrandWordmark";

export { BrandWordmark };

export function BrandHeader() {
  const { state, navigate, setSheet } = useGalla();
  const unread = state.notificationsSeen ? 0 : 4;
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4">
      <button type="button" onClick={() => navigate("settings")} aria-label="Profile and business settings" className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-50 text-[13px] font-extrabold text-navy ring-1 ring-sky-100">
        SL
      </button>
      <button type="button" onClick={() => navigate("home")} className="min-w-0 flex-1 text-left leading-tight" aria-label="Go to home">
        <span className="flex items-center gap-1.5">
          <BrandWordmark height={15} />
          <span className="text-[11px] font-semibold text-muted">Udhaar back-office</span>
          <span className="rounded bg-canvas px-1 py-px text-[9px] font-bold uppercase tracking-wide text-faint">Prototype</span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-ink">{MERCHANT.name}</span>
      </button>
      <button type="button" onClick={() => setSheet({ type: "notifications" })} aria-label={`Notifications${unread ? `, ${unread} new` : ""}`} className="relative grid size-10 place-items-center rounded-full hover:bg-canvas">
        <Bell className="size-5 text-navy" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-bad text-[9px] font-bold text-white">{unread}</span>}
      </button>
    </header>
  );
}
