import { useAuth } from '@/hooks/useAuth';
import VendorAuth from '@/components/VendorAuth';
import VendorDashboard from '@/components/VendorDashboard';
import { Check, Store, ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

const benefits = [
  'Reach gifting customers across India with curated hampers',
  'Mark products as available for gift hampers with maximum quantities',
  'Create complete personalized gift hampers with custom packaging fees',
  'Receive & process orders live in a dedicated vendor dashboard',
  'GST-ready business registration and verified vendor payouts',
];

export default function VendorPage() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto font-sans">
        <LoadingSkeleton type="dashboard" />
      </main>
    );
  }

  const isAuthorizedVendor = Boolean(session && (profile?.role === 'vendor' || profile?.role === 'admin'));
  const isCustomerAccount = Boolean(session && profile?.role === 'user');

  // ONLY authorized vendors (or admins) can access & manage the Vendor Dashboard
  if (isAuthorizedVendor) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4 sm:px-8 font-sans">
        <VendorDashboard onSignOut={() => void signOut()} />
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-16 font-sans">
      <header className="border-b border-cream-200 bg-cream-100/50 px-5 py-12 dark:border-gray-800 dark:bg-gray-900 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
              Partner with A_S Hamper
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-wine-800 sm:text-5xl dark:text-white">
              Vendor Zone &amp; Partner Studio
            </h1>
            <p className="mt-3 max-w-2xl text-ink-700/70 dark:text-gray-300">
              Sign in with your registered vendor email to manage products, build hampers, and fulfill customer orders.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Notice for Customer Account attempting to access Vendor Zone */}
        {isCustomerAccount ? (
          <div className="max-w-2xl mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 p-8 text-center space-y-4 shadow-xl">
            <span className="grid place-items-center h-14 w-14 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 mx-auto">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <h2 className="font-display text-2xl font-semibold text-amber-900 dark:text-amber-100">
              Vendor Authorization Required
            </h2>
            <p className="text-sm text-amber-800/80 dark:text-amber-200/80 max-w-md mx-auto">
              You are currently signed in as a <strong className="capitalize">{profile?.role || 'Customer'}</strong> ({session?.user?.email}). Only verified Vendor accounts can access and manage the Vendor Zone.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-full bg-wine-600 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-wine-700 transition-colors shadow-md"
              >
                <LogOut className="h-4 w-4" />
                Sign Out &amp; Log In as Vendor
              </button>
              <Link
                to="/customer"
                className="inline-flex items-center gap-2 rounded-full border border-amber-400 dark:border-amber-600 px-6 py-3 text-sm font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                Go to Customer Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="rounded-3xl bg-wine-700 p-8 text-cream-50 sm:p-10 shadow-xl">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-500/20 text-gold-300">
                <Store className="h-6 w-6" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold">
                Grow your gifting business with us
              </h2>
              <p className="mt-4 max-w-lg text-cream-200/85 text-sm leading-relaxed">
                Sign up with your business details. Create custom gift hampers, set component quantities, add packaging charges, and fulfill customer orders in real time.
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
          </div>
        )}
      </main>
    </div>
  );
}
