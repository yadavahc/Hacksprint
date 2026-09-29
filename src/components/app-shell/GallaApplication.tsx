"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Component, type ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav/BottomNav";
import { SheetHost } from "@/components/chat/sheets";
import { DemoFinale, MobileDemoCaption } from "@/components/demo/DemoDirector";
import { GallaScreen } from "@/components/galla/GallaScreen";
import { BrandHeader } from "@/components/brand-header/BrandHeader";
import { usePresentationMode } from "@/components/presentation-mode/PresentationModeContext";
import { Button } from "@/components/ui/primitives";
import { VoiceOverlay } from "@/components/voice/VoiceOverlay";
import { useGalla } from "@/lib/store/provider";
import { SCREENS } from "./screens";
import { DemoFooter, Toasts } from "./shell-bits";

class ScreenErrorBoundary extends Component<{ children: ReactNode; onHome: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[galla] screen error", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="m-4 rounded-2xl bg-white p-5 text-center shadow-card">
        <p className="text-[15px] font-bold text-ink">This screen hit a problem</p>
        <p className="mt-1 text-[13px] text-muted">Your data is safe. Let&apos;s go back home.</p>
        <Button className="mt-3" onClick={this.props.onHome}>
          Go home
        </Button>
      </div>
    );
  }
}

/** The one live GALLA application. Rendered once — Phone and Normal mode only wrap it. */
export function GallaApplication() {
  const { state, navigate } = useGalla();
  const { isMobile } = usePresentationMode();
  const key = `${state.route.name}:${JSON.stringify(state.route.params ?? {})}`;
  const Screen = state.route.name === "galla" ? null : SCREENS[state.route.name];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas text-ink">
      <BrandHeader />
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false}>
          <motion.div key={key} className="absolute inset-0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {Screen ? (
              <div className="no-scrollbar h-full overflow-y-auto">
                <ScreenErrorBoundary key={key} onHome={() => navigate("home")}>
                  <Screen />
                </ScreenErrorBoundary>
                <DemoFooter />
              </div>
            ) : (
              <GallaScreen />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
      <Toasts />
      <VoiceOverlay />
      <SheetHost />
      <DemoFinale />
      {isMobile && <MobileDemoCaption />}
    </div>
  );
}
