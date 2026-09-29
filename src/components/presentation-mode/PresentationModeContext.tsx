"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type PresentationMode = "phone" | "normal";

interface PresentationValue {
  mode: PresentationMode;
  setMode: (mode: PresentationMode) => void;
  /** Real phone-sized viewport: the frame is disabled and the app runs full-screen. */
  isMobile: boolean;
  effectiveMode: PresentationMode;
}

const KEY = "galla:presentation";
const Ctx = createContext<PresentationValue | null>(null);

export function PresentationModeProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const [mode, setModeState] = useState<PresentationMode>(() => {
    // Shareable override: /app?presentation=normal or ?presentation=phone
    const fromUrl = new URLSearchParams(window.location.search).get("presentation");
    if (fromUrl === "phone" || fromUrl === "normal") return fromUrl;
    try {
      const saved = window.sessionStorage.getItem(KEY);
      if (saved === "phone" || saved === "normal") return saved;
    } catch {
      // ignore
    }
    // Desktop and tablet default to the phone presentation when there is room for it.
    return window.matchMedia("(min-width: 768px) and (min-height: 640px)").matches ? "phone" : "normal";
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setMode = useCallback((next: PresentationMode) => {
    setModeState(next);
    try {
      window.sessionStorage.setItem(KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return <Ctx.Provider value={{ mode, setMode, isMobile, effectiveMode: isMobile ? "normal" : mode }}>{children}</Ctx.Provider>;
}

export function usePresentationMode() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePresentationMode must be used inside PresentationModeProvider");
  return v;
}
