import { Header } from "@/components/home/header";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { CtaSection } from "@/components/home/cta-section";
import { Footer } from "@/components/home/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
