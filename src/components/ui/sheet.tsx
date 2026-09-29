"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Bottom sheet scoped to the app container (works identically inside the phone frame). */
export function BottomSheet({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; labelledBy?: string }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]")?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <motion.button type="button" aria-label="Close" className="absolute inset-0 bg-navy-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy ?? "sheet-title"}
            className="relative max-h-[88%] overflow-y-auto rounded-t-3xl bg-white pb-[calc(16px+var(--safe-bottom,0px))] shadow-float"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 pb-2 pt-3">
              <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line" aria-hidden />
              <h2 id={labelledBy ?? "sheet-title"} className="pt-2 text-base font-bold text-ink">
                {title}
              </h2>
              <button type="button" onClick={onClose} className="mt-1 grid size-10 place-items-center rounded-full hover:bg-canvas" aria-label="Close">
                <X className="size-5 text-muted" />
              </button>
            </div>
            <div className="px-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
