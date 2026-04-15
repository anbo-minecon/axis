// app/landing/page.tsx
"use client";

import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { AreasICFES } from "@/components/landing/AreasICFES";
import { Caracteristicas } from "@/components/landing/Caracteristicas";
import { WhyAXIS } from "@/components/landing/WhyAXIS";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { ImpactStats } from "@/components/landing/ImpactStats";
import { EducationalResources } from "@/components/landing/EducationalResources";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      
      <HeroSection />
      <AreasICFES />
      <Caracteristicas />
      <WhyAXIS />
      <HowItWorks />
      <Testimonials />
      <ImpactStats />
      <EducationalResources />
      
      <section id="planes">
        <PricingPlans />
      </section>
      
      <section id="faq">
        <FAQ />
      </section>
      
      <FinalCTA />
      <Footer />
    </main>
  );
}
