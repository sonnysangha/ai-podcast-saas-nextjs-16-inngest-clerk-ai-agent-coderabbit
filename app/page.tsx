import { Header } from "@/components/home/header";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { CtaSection } from "@/components/home/cta-section";
import { Footer } from "@/components/home/footer";
import { RealtimeTest } from "@/components/realtime-test";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Realtime Test Section */}
      <section className="py-12 px-4 bg-muted/50">
        <RealtimeTest />
      </section>

      <Header />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
