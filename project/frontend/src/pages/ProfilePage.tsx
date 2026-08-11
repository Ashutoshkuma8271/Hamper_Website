import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, LogOut, Package, ShieldCheck, UserRound } from 'lucide-react';
import AdminAuth from '@/components/AdminAuth';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileSection from '@/components/ProfileSection';
import UserAuth from '@/components/UserAuth';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import PasswordField, { isStrongPassword } from '@/components/PasswordField';

type LoginType = 'user' | 'admin';

const adminCapabilities = [
  ['Add products', 'Create hampers with categories, images, prices, and stock.'],
  ['Edit inventory', 'Update product details and availability whenever needed.'],
  ['Remove products', 'Remove items that are no longer available.'],
  ['Manage orders', 'Review orders and update their delivery status.'],
];

const userBenefits = [
  ['Track your orders', 'See the current status of your hamper deliveries.'],
  ['Save your details', 'Keep your account information ready for future purchases.'],
  ['Faster checkout', 'Use your account to make shopping simpler.'],
  ['Exclusive offers', 'Get access to new collections and special deals.'],
];

export default function ProfilePage() {
  const { session, profile, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<LoginType>(() => location.pathname === '/admin' ? 'admin' : 'user');

  if (searchParams.get('reset') === '1') return <ResetPassword />;
  if (session && !loading && isAdmin) return <Navigate to="/admin" replace />;
  if (session && !loading && profile?.role === 'vendor') return <Navigate to="/vendor" replace />;

  return (
    <div className="min-h-screen px-5 pb-20 pt-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-wine-600 dark:text-gray-400 dark:hover:text-wine-400"><ArrowLeft className="h-4 w-4" />Back to home</Link>
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">Account portal</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-wine-800 sm:text-4xl lg:text-5xl dark:text-white">{session && isAdmin ? 'Admin dashboard' : session ? 'Your profile' : 'Sign in to continue'}</h1>
          <p className="mt-4 text-ink-700/70 dark:text-gray-300">{session && isAdmin ? 'Add, edit, remove, and manage all products from one place.' : session ? 'Manage your account details and continue shopping.' : 'Sign in or create a customer account, or use the separate admin login.'}</p>
        </div>

        {!session && <div className="mb-8 inline-flex rounded-full bg-cream-100 p-1 dark:bg-gray-800">
          <button onClick={() => setActiveTab('user')} className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${activeTab === 'user' ? 'bg-wine-600 text-white shadow-sm' : 'text-ink-700/70 hover:text-wine-700 dark:text-gray-300'}`}><UserRound className="mr-2 inline h-4 w-4" />Customer account</button>
          <button onClick={() => setActiveTab('admin')} className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-wine-700 text-white shadow-sm' : 'text-ink-700/70 hover:text-wine-700 dark:text-gray-300'}`}><ShieldCheck className="mr-2 inline h-4 w-4" />Admin access</button>
        </div>}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>{!session ? activeTab === 'user' ? <UserAuth /> : <AdminAuth /> : isAdmin ? <AdminNotice /> : <ProfileSection />}</div>
          <div>{session && isAdmin ? <AdminDashboard /> : <InfoPanel items={activeTab === 'admin' ? adminCapabilities : userBenefits} admin={activeTab === 'admin'} />}</div>
        </div>
      </div>
    </div>
  );
}

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!isStrongPassword(password)) { setError('Use at least 8 characters with uppercase, lowercase, and a number.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!supabase) { setError('Authentication is not configured.'); return; }
    setLoading(true); setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setComplete(true);
  }

  return <div className="min-h-screen px-5 pb-20 pt-24 sm:px-8"><div className="mx-auto max-w-md rounded-3xl bg-cream-50 p-6 ring-1 ring-cream-200 shadow-[0_30px_70px_-40px_rgba(87,34,44,0.4)] sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
    {complete ? <div className="text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage-500/15 text-sage-500"><CheckCircle2 className="h-7 w-7" /></span><h1 className="mt-5 font-display text-2xl font-semibold text-wine-700 dark:text-white">Password updated</h1><p className="mt-2 text-sm text-ink-700/70 dark:text-gray-300">Your new password is ready to use.</p><button onClick={() => navigate('/profile', { replace: true })} className="mt-6 rounded-full bg-wine-600 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-wine-700">Continue</button></div> : <><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-wine-600 text-cream-50"><Lock className="h-5 w-5" /></span><div><h1 className="font-display text-2xl font-semibold text-wine-700 dark:text-white">Set a new password</h1><p className="text-sm text-ink-700/70 dark:text-gray-300">Choose a strong password for your account.</p></div></div><form onSubmit={savePassword} className="mt-7 space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-700/60 dark:text-gray-400">New password</span><PasswordField value={password} onChange={setPassword} autoComplete="new-password" showStrength placeholder="Create a strong password" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-700/60 dark:text-gray-400">Confirm password</span><PasswordField value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Repeat your password" /></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="w-full rounded-full bg-wine-600 py-3.5 text-sm font-semibold text-cream-50 hover:bg-wine-700 disabled:opacity-60">{loading ? 'Saving…' : 'Save new password'}</button></form></>}
  </div></div>;
}

function AdminNotice() {
  const { signOut } = useAuth();
  return <div className="rounded-3xl bg-wine-700 p-6 text-cream-50 sm:p-8"><span className="grid h-11 w-11 place-items-center rounded-full bg-gold-500/20 text-gold-300"><ShieldCheck className="h-5 w-5" /></span><h2 className="mt-4 font-display text-xl font-semibold">Admin access</h2><p className="mt-2 text-sm text-cream-200/80">Use the dashboard to manage products, stock, and customer orders.</p><button onClick={() => void signOut()} className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream-50/30 px-5 py-2.5 text-sm font-medium hover:bg-cream-50/10"><LogOut className="h-4 w-4" />Log out</button></div>;
}

function InfoPanel({ items, admin }: { items: string[][]; admin: boolean }) {
  return <div className="rounded-3xl bg-cream-50 p-8 ring-1 ring-cream-200 sm:p-10 dark:bg-gray-800 dark:ring-gray-700"><span className="grid h-11 w-11 place-items-center rounded-full bg-gold-500/15 text-gold-600">{admin ? <Package className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</span><h2 className="mt-4 font-display text-xl font-semibold text-wine-700 dark:text-white">{admin ? 'Admin product controls' : 'User account benefits'}</h2><ol className="mt-6 space-y-5">{items.map(([title, description], index) => <li key={title} className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wine-600 font-display font-semibold text-cream-50">{index + 1}</span><div><p className="font-display font-semibold text-wine-700 dark:text-white">{title}</p><p className="text-sm text-ink-700/65 dark:text-gray-400">{description}</p></div></li>)}</ol></div>;
}
