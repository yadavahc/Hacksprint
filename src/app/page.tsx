import { AboutSection } from "@/components/landing/AboutSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { DifferentSection } from "@/components/landing/DifferentSection";
import { FinalCta, LandingFooter } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingNav } from "@/components/landing/LandingNav";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { TrustSection } from "@/components/landing/TrustSection";
import { VoiceSection } from "@/components/landing/VoiceSection";

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-deep">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-navy">
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <Hero />
        <ProblemSection />
        <AboutSection />
        <HowItWorks />
        <ProductDemo />
        <DifferentSection />
        <CapabilitiesSection />
        <VoiceSection />
        <TrustSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
