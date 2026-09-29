"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(prev.current, value, { duration: 0.7, ease: "easeOut", onUpdate: (v) => setDisplay(v) });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <span className={className}>{format(display)}</span>;
}

export function Avatar({ name, size = 32, tone = "sky" }: { name: string; size?: number; tone?: "sky" | "navy" | "bad" | "good" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const cls = { sky: "bg-sky-50 text-sky-700", navy: "bg-navy text-white", bad: "bg-bad-50 text-bad", good: "bg-good-50 text-good" }[tone];
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full font-bold ${cls}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}
