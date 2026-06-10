import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Demo } from '@/components/landing/demo';
import { Pricing } from '@/components/landing/pricing';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Demo />
      <Pricing />
      <Footer />
    </main>
  );
}
