import { Nav } from '@/components/marketing/Nav';
import { Hero } from '@/components/marketing/Hero';
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
        <FeatureGrid />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
