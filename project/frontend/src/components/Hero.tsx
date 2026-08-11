import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_IMG = '/hero-hamper.webp';

export default function Hero() {
  return (
    <section id="top" className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gold-300/30 blur-3xl" />
        <div className="absolute top-40 -right-20 h-80 w-80 rounded-full bg-wine-400/15 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-cream-100 px-4 py-1.5 text-xs font-medium tracking-wide text-wine-600 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            Personalised gifting, since 2016
          </span>

          <h1 className="mt-6 font-display font-semibold text-wine-800 text-balance text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            Hampers that feel{' '}
            <span className="relative inline-block">
              <span className="italic text-gold-600">hand-written</span>
              <svg
                className="absolute -bottom-2 left-0 w-full text-gold-400/70"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9C40 3 160 2 198 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            , not shopped.
          </h1>

          <p className="mt-6 text-lg text-ink-700/80 max-w-xl leading-relaxed">
            Choose a basket, fill it with the things they love, tuck in a photo and a note.
            We hand-pack every order and deliver it on the day that matters.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#bestsellers"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('bestsellers');
                if (el) {
                  const yOffset = -80; // account for fixed navbar height
                  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-wine-600 px-7 py-3.5 text-sm font-medium text-cream-50 shadow-[0_10px_30px_-12px_rgba(87,34,44,0.7)] transition-all hover:bg-wine-700 hover:shadow-[0_14px_36px_-12px_rgba(87,34,44,0.8)] hover:-translate-y-0.5 cursor-pointer"
            >
              Shop best sellers
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('how');
                if (el) {
                  const yOffset = -80; // account for fixed navbar height
                  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-wine-600/30 px-7 py-3.5 text-sm font-medium text-wine-700 transition-colors hover:bg-cream-100 dark:text-cream-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              How it works
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
              ))}
            </div>
            <p className="text-sm text-ink-700/70 dark:text-gray-300">
              <span className="font-semibold text-ink-800 dark:text-cream-100">12,400+</span> hampers hand-packed
            </p>
          </div>
        </div>

        {/* image */}
        <div className="relative">
          <div className="relative aspect-[4/5] sm:aspect-[5/6] rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-30px_rgba(47,19,26,0.55)] ring-1 ring-cream-300/50 bg-cream-100">
            <img
              src={HERO_IMG}
              alt="Luxury hand-packed gift hamper with chocolates, candle and dried flowers"
              width={800}
              height={1000}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wine-800/40 via-transparent to-transparent" />
          </div>

          {/* floating interactive cards */}
          <Link
            to="/hand-packed"
            className="absolute -left-3 sm:-left-6 top-10 rounded-2xl bg-cream-50/95 dark:bg-gray-800/95 dark:ring-gray-700 backdrop-blur-md px-4 py-3 shadow-xl ring-1 ring-cream-200 animate-float-slow transition-transform hover:scale-105 hover:ring-gold-400 group cursor-pointer"
            title="Learn about our hand-packing process"
          >
            <p className="text-[11px] uppercase tracking-wider text-gold-600 dark:text-gold-400 font-medium group-hover:text-wine-700 transition-colors">
              Hand-packed →
            </p>
            <p className="text-sm font-display font-semibold text-wine-700 dark:text-cream-50">Small batches</p>
          </Link>

          <Link
            to="/same-day-delivery"
            className="absolute -right-3 sm:-right-5 bottom-12 rounded-2xl bg-cream-50/95 dark:bg-gray-800/95 dark:ring-gray-700 backdrop-blur-md px-4 py-3 shadow-xl ring-1 ring-cream-200 animate-float-slow [animation-delay:1.5s] transition-transform hover:scale-105 hover:ring-gold-400 group cursor-pointer"
            title="Check same-day delivery availability"
          >
            <p className="text-[11px] uppercase tracking-wider text-gold-600 dark:text-gold-400 font-medium group-hover:text-wine-700 transition-colors">
              On the day →
            </p>
            <p className="text-sm font-display font-semibold text-wine-700 dark:text-cream-50">Delivery</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
