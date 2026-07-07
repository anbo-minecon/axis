// app/landing/page.tsx
import { Navigation } from "@/components/landing/Navigation";
import { AnunciosModal } from "@/components/landing/AnunciosModal";
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

async function getAnuncios() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/anuncios`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data.anuncios ?? [];
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const anuncios   = await getAnuncios();
  const hayAnuncios = anuncios.length > 0;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <AnunciosModal anuncios={anuncios} />

      <HeroSection />
      <AreasICFES />

      <Caracteristicas />
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