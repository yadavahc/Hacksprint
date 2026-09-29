"use client";

import { animate, motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/components/ui/primitives";

export function Reveal({ children, delay = 0, y = 26, x = 0, className }: { children: ReactNode; delay?: number; y?: number; x?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y, x }} whileInView={{ opacity: 1, y: 0, x: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.75, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.22em]", dark ? "text-sky" : "text-sky-700")}>
      <span className="size-1.5 rounded-full bg-sky" aria-hidden />
      {children}
    </p>
  );
}

export function Headline({ lines, dark = false, className, as: As = "h2" }: { lines: string[]; dark?: boolean; className?: string; as?: "h1" | "h2" }) {
  return (
    <As className={cn("text-balance font-extrabold uppercase leading-[0.98] tracking-[-0.02em]", dark ? "text-white" : "text-navy-900", className)}>
      {lines.map((line, i) => (
        <motion.span
          key={line}
          className={cn("block", i === lines.length - 1 && lines.length > 1 && (dark ? "text-sky" : "text-sky-600"))}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: i * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {line}
        </motion.span>
      ))}
    </As>
  );
}

export function CountUp({ to, format = (n) => Math.round(n).toLocaleString("en-IN"), duration = 1.4, className }: { to: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: "easeOut", onUpdate: setValue });
    return () => c.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

export function CtaLink({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "ghost" | "light"; className?: string }) {
  const styles = {
    primary: "bg-sky text-navy-900 hover:bg-white shadow-[0_18px_40px_-16px_rgba(44,197,201,0.8)]",
    ghost: "text-white ring-1 ring-white/25 hover:bg-white/10",
    light: "bg-navy text-white hover:bg-navy-700 shadow-float",
  }[variant];
  return (
    <Link href={href} className={cn("inline-flex h-13 min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[14px] font-extrabold uppercase tracking-wider transition-colors", styles, className)}>
      {children}
    </Link>
  );
}

export function useStepTimer(steps: number, stepMs: number, active: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI((v) => (v + 1) % steps), stepMs);
    return () => clearInterval(id);
  }, [steps, stepMs, active]);
  return [i, setI] as const;
}
