"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PHONE, PhoneFrame } from "@/components/phone-frame/PhoneFrame";
import { cn } from "@/components/ui/primitives";
import { usePresentationMode } from "./PresentationModeContext";

/**
 * Presentation-only wrapper. Phone mode: PhoneFrame → application. Normal mode: application in a
 * responsive container. The same `children` element (the one live GallaApplication) is always
 * rendered at the same tree position, so switching never resets state.
 */
export function PresentationWrapper({ children }: { children: ReactNode }) {
  const { effectiveMode, isMobile } = usePresentationMode();
  const phone = effectiveMode === "phone";
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 120, damping: 20 });
  const rotateY = useSpring(ry, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const h = el.clientHeight - 24;
      const w = el.clientWidth - 24;
      const full = PHONE.screenH + PHONE.bezel * 2;
      setScale(Math.min(1, h / full, w / (PHONE.screenW + PHONE.bezel * 2)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!phone || e.pointerType !== "mouse") return;
    const el = stageRef.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Subtle parallax; flattens when the pointer is over the device so interaction stays crisp.
    const overDevice = Math.abs(px) < (PHONE.screenW * scale) / r.width / 2 + 0.02;
    rx.set(overDevice ? 0 : -py * 5);
    ry.set(overDevice ? 0 : px * 7);
  };

  const outerW = phone ? (PHONE.screenW + PHONE.bezel * 2) * scale : undefined;
  const outerH = phone ? (PHONE.screenH + PHONE.bezel * 2) * scale : undefined;

  return (
    <div
      ref={stageRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className={cn("relative flex h-full w-full justify-center", phone ? "items-center" : "items-stretch", !isMobile && "px-3 py-3")}
      style={{ perspective: 1600 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        className={cn("relative", phone ? "" : "h-full w-full max-w-[520px]")}
        style={{ width: outerW, height: outerH, rotateX: phone ? rotateX : 0, rotateY: phone ? rotateY : 0, transformStyle: "preserve-3d" }}
      >
        <div className={cn(phone ? "absolute left-0 top-0 origin-top-left" : "h-full w-full")} style={phone ? { transform: `scale(${scale})` } : undefined}>
          <PhoneFrame active={phone}>{children}</PhoneFrame>
        </div>
      </motion.div>
    </div>
  );
}
