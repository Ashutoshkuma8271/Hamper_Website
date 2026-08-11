import Hero from '@/components/Hero';
import Steps from '@/components/Steps';
import BestSellers from '@/components/BestSellers';
import DeferredSection from '@/components/DeferredSection';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <DeferredSection load={() => import('@/components/Marquee')} minHeight={56} />
      <DeferredSection load={() => import('@/components/Categories')} minHeight={880} />
      <Steps />
      <BestSellers />
      <DeferredSection load={() => import('@/components/Corporate')} minHeight={760} />
      <DeferredSection load={() => import('@/components/Testimonials')} minHeight={650} />
      <DeferredSection load={() => import('@/components/About')} minHeight={700} />
    </main>
  );
}
