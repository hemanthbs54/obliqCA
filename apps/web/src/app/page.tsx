import { Nav } from '@/components/marketing/Nav';
import { Hero } from '@/components/marketing/Hero';
import { TechStack } from '@/components/marketing/TechStack';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { CTASection } from '@/components/marketing/CTASection';
import { Footer } from '@/components/marketing/Footer';

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TechStack />
        <FeatureGrid />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
