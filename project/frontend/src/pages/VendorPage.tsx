import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import VendorAuth from '@/components/VendorAuth';
import VendorDashboard from '@/components/VendorDashboard';
import { Check, Store, Sparkles, UserCheck } from 'lucide-react';

const benefits = [
  'Reach gifting customers across India with curated hampers',
  'Mark products as available for gift hampers with maximum quantities',
  'Create complete personalized gift hampers with custom packaging fees',
  'Receive & process orders in a dedicated vendor dashboard',
  'GST-ready business registration and verified vendor payouts',
];

export default function VendorPage() {
  const { session, profile, signOut } = useAuth();
  const [demoActive, setDemoActive] = useState(false);

  // If vendor session exists or demo toggle is enabled, show full Vendor Dashboard!
  if (session || demoActive) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4 sm:px-8">
        <VendorDashboard onSignOut={() => { setDemoActive(false); void signOut(); }} />
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-16">
      <header className="border-b border-cream-200 bg-cream-100/50 px-5 py-14 dark:border-gray-800 dark:bg-gray-900 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
              Partner with A_S Hamper
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-wine-800 sm:text-5xl dark:text-white">
              Vendor Portal & Hamper Studio
            </h1>
            <p className="mt-3 max-w-2xl text-ink-700/70 dark:text-gray-300">
              Sign in or create a vendor account to manage your products, build personalized gift hampers & track orders.
            </p>
          </div>

          {/* Quick Demo Access Button */}
          <button
            onClick={() => setDemoActive(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-ink-900 shadow-md hover:bg-gold-400 transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            Enter Vendor Portal (Demo Mode)
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl items-start gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="rounded-3xl bg-wine-700 p-8 text-cream-50 sm:p-10 shadow-xl">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-500/20 text-gold-300">
            <Store className="h-6 w-6" />
          </span>
          <h2 className="mt-6 font-display text-3xl font-semibold">
            Grow your gifting business with us
          </h2>
          <p className="mt-4 max-w-lg text-cream-200/85 text-sm leading-relaxed">
            Sign up with your business information. Create custom gift hampers, set component quantities, add packaging charges, and publish directly to our customer storefront.
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-500/20 text-gold-300">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <VendorAuth />
      </main>
    </div>
  );
}
