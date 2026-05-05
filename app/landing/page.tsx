// app/landing/page.tsx
import { Navigation } from "@/components/landing/Navigation";
import { AnunciosCarousel } from "@/components/landing/AnunciosCarousel";
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

      {/*
        ── Zona superior (ocupa el 100vh sin scroll) ──
        Si hay anuncios: carrusel compacto + AreasICFES visible justo debajo
        Si no hay anuncios: HeroSection como siempre
      */}
      {hayAnuncios ? (
        // pt-[64px] = altura del header fijo
        <div className="pt-[64px] min-h-screen flex flex-col">
          {/* Carrusel — altura dinámica estilo ML */}
          <AnunciosCarousel anuncios={anuncios} />

          {/* AreasICFES inmediatamente debajo, visible sin scroll */}
          <div className="flex-1 bg-white dark:bg-gray-900">
            <AreasICFES />
          </div>
        </div>
      ) : (
        <HeroSection />
      )}

      {/*
        Si hay anuncios AreasICFES ya se renderizó arriba, no repetir.
        Si no hay, se muestra normalmente en el flujo.
      */}
      {!hayAnuncios && <AreasICFES />}

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