import { Quote } from 'lucide-react';
import { testimonials } from '@/data';
import { useReveal } from '@/hooks/useReveal';

export default function Testimonials() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="py-20 sm:py-28 bg-cream-100/50 border-y border-cream-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
            Kind words
          </p>
          <h2 className="mt-3 font-display font-semibold text-wine-800 text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            From people who gifted
          </h2>
        </div>

        <div
          ref={ref}
          className={`grid md:grid-cols-3 gap-6 reveal ${visible ? 'is-visible' : ''}`}
        >
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="relative rounded-3xl bg-cream-50 p-7 sm:p-8 ring-1 ring-cream-200 transition-all duration-500 hover:-translate-y-1.5 hover:ring-gold-400/40"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <Quote className="h-8 w-8 text-gold-400/60" fill="currentColor" />
              <blockquote className="mt-5 font-display text-lg text-wine-700 leading-relaxed text-balance">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-full bg-wine-600 text-cream-50 font-display font-semibold">
                  {t.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-800">{t.author}</p>
                  <p className="text-xs text-ink-700/60">{t.location}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
