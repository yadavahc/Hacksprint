"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BrandWordmark } from "@/components/brand-header/BrandWordmark";
import { cn } from "@/components/ui/primitives";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#demo", label: "Demo" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#trust", label: "Trust" },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-colors duration-300", scrolled || open ? "bg-deep/85 backdrop-blur-xl ring-1 ring-white/10" : "bg-transparent")}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5" aria-label="Primary">
        <Link href="/" className="flex items-center gap-2" aria-label="GALLA home">
          <BrandWordmark onDark height={16} />
          <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70 sm:inline">HackSprint prototype</span>
        </Link>
        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3 py-2 text-[13.5px] font-semibold text-white/75 transition-colors hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/app" className="ml-auto inline-flex h-10 items-center rounded-full bg-sky px-5 text-[13px] font-extrabold uppercase tracking-wider text-navy-900 transition-colors hover:bg-white md:ml-2">
          Try Galla
        </Link>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu" className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10 md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-5 pb-4 md:hidden">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-[15px] font-semibold text-white/85 hover:bg-white/10">
                  {l.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
