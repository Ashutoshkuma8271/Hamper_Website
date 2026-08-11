import { Heart, Package, Users, Award } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const values = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: 'Hand-packed with love',
    description: 'Every hamper is carefully assembled by our team, ensuring each item is placed with care and attention to detail.',
  },
  {
    icon: <Package className="h-6 w-6" />,
    title: 'Premium quality products',
    description: 'We source only the finest products from trusted suppliers, from artisan chocolates to hand-poured candles.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Personalized experience',
    description: 'Add your personal touch with custom messages, photos, and carefully selected items that tell your story.',
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: 'On-time delivery',
    description: 'We understand the importance of timing. Your hamper arrives exactly when it matters most.',
  },
];

const milestones = [
  { year: '2016', title: 'Founded', description: 'Started with a small workshop and a big dream' },
  { year: '2018', title: '1,000 Orders', description: 'Celebrated our first major milestone' },
  { year: '2020', title: 'Corporate Partnerships', description: 'Expanded to serve businesses across India' },
  { year: '2024', title: '12,400+ Hampers', description: 'Continuing to spread joy, one hamper at a time' },
];

export default function About() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
            Our Story
          </p>
          <h2 className="mt-4 font-display font-semibold text-wine-800 text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Crafting memories since 2016
          </h2>
          <p className="mt-6 text-lg text-gray-700 leading-relaxed">
            What started as a small passion project has grown into a beloved gifting service. 
            We believe every gift should tell a story, and we're here to help you tell yours.
          </p>
        </div>

        {/* Values */}
        <div
          ref={ref}
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-20 reveal ${
            visible ? 'is-visible' : ''
          }`}
        >
          {values.map((value, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl bg-cream-50 ring-1 ring-cream-200"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-wine-600/10 text-wine-600 mb-4">
                {value.icon}
              </div>
              <h3 className="font-display font-semibold text-wine-700 text-lg mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          <div>
            <h3 className="font-display font-semibold text-wine-800 text-2xl sm:text-3xl mb-6">
              From a small workshop to your doorstep
            </h3>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                It all began in a small workshop where we hand-packed our first hampers with 
                locally sourced treats and handwritten notes. The joy we saw on our customers' 
                faces fueled our passion.
              </p>
              <p>
                Today, we've grown but our values remain the same. Every hamper is still 
                hand-packed with the same care and attention to detail as that very first order.
              </p>
              <p>
                We've had the privilege of being part of thousands of special moments - birthdays, 
                anniversaries, weddings, corporate celebrations, and everything in between.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-wine-600 to-wine-800 p-8">
              <div className="grid grid-cols-2 gap-4 h-full">
                {milestones.map((milestone, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center"
                  >
                    <span className="text-3xl font-display font-bold text-gold-300">
                      {milestone.year}
                    </span>
                    <span className="text-white font-semibold mt-1">
                      {milestone.title}
                    </span>
                    <span className="text-cream-200/80 text-xs mt-2">
                      {milestone.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="text-center">
          <h3 className="font-display font-semibold text-wine-800 text-2xl sm:text-3xl mb-4">
            Meet the team
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Our dedicated team of designers, packers, and customer service specialists 
            work together to make every gifting experience special.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Design', 'Packing', 'Logistics', 'Support'].map((role) => (
              <div
                key={role}
                className="aspect-square rounded-2xl bg-cream-100 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-wine-600/20 mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-8 w-8 text-wine-600" />
                  </div>
                  <span className="font-medium text-wine-700">{role} Team</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
