"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-header/BrandWordmark";
import { GallaMark } from "@/components/ui/ai-bits";
import { CtaLink, Headline } from "./primitives";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-deep px-5 py-28 text-center text-white sm:py-40" aria-labelledby="cta-title">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex h-56 items-end justify-center gap-[6px] opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]">
        {Array.from({ length: 64 }, (_, i) => (
          <span key={i} className="w-[5px] origin-bottom animate-wave rounded-t-full bg-sky" style={{ height: `${30 + ((i * 53) % 170)}px`, animationDelay: `${(i % 9) * 0.13}s`, animationDuration: `${1.2 + (i % 5) * 0.2}s` }} />
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(44,197,201,0.22),transparent)]" />
      <div className="relative mx-auto max-w-5xl">
        <GallaMark size={56} animated className="mx-auto" />
        <div id="cta-title" className="mt-8">
          <Headline dark as="h2" lines={["Your business is already talking.", "Now let Galla listen."]} className="text-[clamp(34px,6vw,80px)]" />
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaLink href="/app">
            Open Galla <ArrowRight className="size-4" aria-hidden />
          </CtaLink>
          <Link href="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-full px-7 text-[14px] font-extrabold uppercase tracking-wider text-white ring-1 ring-white/25 transition-colors hover:bg-white/10">
            <Play className="size-4" fill="currentColor" aria-hidden /> See demo
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-[#020818] px-5 py-10 text-white/55">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <GallaMark size={26} />
          <div>
            <p className="flex items-center gap-1.5 text-[14px] font-extrabold text-white">
              <BrandWordmark onDark height={12} />
              — HackSprint prototype · Team Spy · Track 1 (PS21)
            </p>
            <p className="text-[12px]">UPI runs on a test gateway only. All merchants, customers and transactions are simulated. No real payments.</p>
          </div>
        </div>
        <nav aria-label="Footer" className="flex gap-5 text-[13px] font-semibold">
          <Link href="/app" className="hover:text-white">
            Live app
          </Link>
          <Link href="/demo" className="hover:text-white">
            90-second demo
          </Link>
          <a href="#how" className="hover:text-white">
            How it works
          </a>
        </nav>
      </div>
    </footer>
  );
}
