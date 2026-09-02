import { categories } from '@/data';
import { useReveal } from '@/hooks/useReveal';
import { Link } from 'react-router-dom';

export default function Categories() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="occasions" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
              Shop by occasion
            </p>
            <h2 className="mt-3 font-display font-semibold text-wine-800 text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Every occasion, wrapped
            </h2>
          </div>
          <p className="max-w-sm text-ink-700/70">
            From first birthdays to fiftieth anniversaries, we tailor each basket to the
            moment.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 reveal ${
            visible ? 'is-visible' : ''
          }`}
        >
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to="/all-hampers"
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-cream-200 transition-all duration-500 hover:ring-gold-400/60 hover:-translate-y-1 bg-cream-100"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                width={940}
                height={1253}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                style={{ contentVisibility: 'auto' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="font-display font-semibold text-cream-50 text-lg sm:text-xl leading-tight">
                  {c.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-cream-200/90">{c.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold-300 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
