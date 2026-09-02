import { ArrowRight, Star, Sparkles, Gift, Clock, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_IMG = '/hero-hamper.webp';
const HERO_FALLBACK = 'https://images.pexels.com/photos/11112057/pexels-photo-11112057.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1200';

export default function Hero() {
  return (
    <section id="top" className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 -left-28 h-[30rem] w-[30rem] rounded-full bg-gold-400/20 blur-[100px]" />
        <div className="absolute top-36 -right-24 h-[28rem] w-[28rem] rounded-full bg-wine-500/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gold-300/15 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Copy & CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/50 bg-cream-100/90 dark:bg-gray-800 dark:text-gold-300 dark:border-gold-500/40 px-3.5 py-1 text-xs font-semibold tracking-wide text-wine-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              Bespoke Artisan Gifting
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-wine-600/10 dark:bg-wine-500/20 px-3 py-1 text-xs font-medium text-wine-800 dark:text-gold-300">
              <Clock className="h-3 w-3 text-wine-600 dark:text-gold-400" />
              Same-day delivery available
            </span>
          </div>

          <h1 className="mt-5 font-display font-bold text-wine-900 dark:text-white text-balance text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
            Luxury hampers crafted to feel{' '}
            <span className="relative inline-block text-wine-600 dark:text-gold-400 font-semibold italic">
              personal
              <svg
                className="absolute -bottom-1.5 left-0 w-full text-gold-500/80"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9C40 3 160 2 198 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            , not packed.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-ink-700/80 dark:text-gray-200 max-w-2xl leading-relaxed">
            Select a handcrafted keepsake box, fill it with artisan delicacies, fragrant candles, and heartfelt keepsakes. We hand-pack each order with satin ribbon and delivers on the exact day.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/build-your-own"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-wine-700 via-wine-600 to-wine-700 px-7 py-3.5 text-sm font-bold text-cream-50 shadow-lg shadow-wine-950/20 transition-all hover:shadow-xl hover:shadow-wine-950/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-gold-300 group-hover:rotate-12 transition-transform" />
              <span>Build your own box</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/all-hampers"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-wine-700/30 bg-cream-50/80 dark:bg-gray-800/90 dark:border-stone-700 px-6 py-3.5 text-sm font-semibold text-wine-800 dark:text-cream-100 hover:bg-wine-600/10 hover:border-wine-600 dark:hover:bg-gray-700 transition-all cursor-pointer shadow-sm"
            >
              <Gift className="h-4 w-4 text-gold-600" />
              <span>Explore pre-curated</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-9 pt-6 border-t border-cream-200/80 dark:border-stone-800 grid grid-cols-3 gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gold-400/20 text-gold-600 dark:text-gold-400 grid place-items-center shrink-0">
                <Star className="h-4 w-4 fill-current" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white leading-none">4.9 / 5.0</p>
                <p className="text-[11px] text-ink-700/60 dark:text-gray-400 mt-0.5">12,400+ reviews</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gold-400/20 text-gold-600 dark:text-gold-400 grid place-items-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white leading-none">100% Quality</p>
                <p className="text-[11px] text-ink-700/60 dark:text-gray-400 mt-0.5">Hand-inspected</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gold-400/20 text-gold-600 dark:text-gold-400 grid place-items-center shrink-0">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white leading-none">Gift Note</p>
                <p className="text-[11px] text-ink-700/60 dark:text-gray-400 mt-0.5">Complimentary</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual */}
        <div className="lg:col-span-5 relative mt-4 lg:mt-0">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-wine-950/25 ring-1 ring-cream-300/80 bg-cream-100 dark:bg-gray-800">
            <img
              src={HERO_IMG}
              alt="Luxury hand-packed gift hamper with chocolates, candle and dried flowers"
              width={800}
              height={1000}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = HERO_FALLBACK;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wine-950/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-cream-50/90 dark:bg-gray-900/90 backdrop-blur-md border border-cream-200/80 dark:border-stone-700 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">Featured Hamper</span>
                  <h4 className="font-display font-bold text-sm text-wine-900 dark:text-white">Royal Velvet Keepsake Hamper</h4>
                </div>
                <Link
                  to="/build-your-own"
                  className="rounded-full bg-wine-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-wine-700 transition-colors shrink-0"
                >
                  Customize →
                </Link>
              </div>
            </div>
          </div>

          {/* Floating badge pills */}
          <Link
            to="/hand-packed"
            className="absolute -left-2 sm:-left-4 top-8 rounded-2xl bg-cream-50/95 dark:bg-gray-800/95 dark:ring-gray-700 backdrop-blur-md px-3.5 py-2.5 shadow-xl ring-1 ring-cream-200 animate-float-slow transition-transform hover:scale-105 hover:ring-gold-400 group cursor-pointer"
            title="Learn about our hand-packing process"
          >
            <p className="text-[10px] uppercase tracking-wider text-gold-600 dark:text-gold-400 font-bold group-hover:text-wine-700 transition-colors">
              Studio Packed ✦
            </p>
            <p className="text-xs font-display font-bold text-wine-800 dark:text-white">Artisan Quality</p>
          </Link>

          <Link
            to="/same-day-delivery"
            className="absolute -right-2 sm:-right-4 bottom-24 rounded-2xl bg-cream-50/95 dark:bg-gray-800/95 dark:ring-gray-700 backdrop-blur-md px-3.5 py-2.5 shadow-xl ring-1 ring-cream-200 animate-float-slow [animation-delay:1.5s] transition-transform hover:scale-105 hover:ring-gold-400 group cursor-pointer"
            title="Check same-day delivery availability"
          >
            <p className="text-[10px] uppercase tracking-wider text-gold-600 dark:text-gold-400 font-bold group-hover:text-wine-700 transition-colors">
              Express Dispatch ⚡
            </p>
            <p className="text-xs font-display font-bold text-wine-800 dark:text-white">Pan-India Delivery</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
