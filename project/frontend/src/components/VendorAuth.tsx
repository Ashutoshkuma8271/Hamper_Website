import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Store, Mail, Lock, UserRound, Phone, FileText, Hash, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { checkRoleCollision, triggerGoogleSignIn, validateSessionRole } from '@/lib/authHelpers';

type Mode = 'login' | 'signup';

export default function VendorAuth() {
  const { session, profile } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [shopNo, setShopNo] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    validateSessionRole().then((roleErr) => {
      if (roleErr) {
        setError(roleErr);
      }
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await triggerGoogleSignIn('vendor', '/vendor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  if (session) {
    return (
      <div className="rounded-3xl bg-cream-50 ring-1 ring-cream-200 p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center h-11 w-11 rounded-full bg-sage-500/15 text-sage-500">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold text-wine-700">
              You're signed in
            </h3>
            <p className="text-sm text-ink-700/70">
              {profile?.business_name || session.user.email} —{' '}
              <span className="capitalize">{profile?.role || 'vendor'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => supabase?.auth.signOut()}
          className="mt-6 rounded-full border border-wine-600/30 px-5 py-2.5 text-sm font-medium text-wine-700 hover:bg-cream-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError('Authentication not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      // Check cross-role collision before attempting login/signup
      const collisionMsg = await checkRoleCollision(email, 'vendor');
      if (collisionMsg) {
        setError(collisionMsg);
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { account_type: 'vendor', business_name: businessName, shop_no: shopNo, gst_no: gstNo, phone },
            emailRedirectTo: `${window.location.origin}/vendor`,
          },
        });
        if (error) throw error;
        setDone(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Verify role is vendor
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (prof?.role && prof.role !== 'vendor') {
          await supabase.auth.signOut();
          const roleName = prof.role === 'admin' ? 'Admin' : 'Customer';
          const portalName = prof.role === 'admin' ? 'Admin Portal' : 'Customer Portal';
          throw new Error(`This email is registered as a ${roleName}. Please sign in using the ${portalName}.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-cream-50 ring-1 ring-cream-200 p-8 sm:p-10 text-center">
        <span className="grid place-items-center h-14 w-14 rounded-full bg-sage-500/15 text-sage-500 mx-auto">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-wine-700">
          Account created
        </h3>
        <p className="mt-2 text-sm text-ink-700/70 max-w-sm mx-auto">
          Your vendor account is ready. Sign in with your email and password to start
          managing your hampers.
        </p>
        <button
          onClick={() => {
            setDone(false);
            setMode('login');
          }}
          className="mt-6 rounded-full bg-wine-600 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-wine-700 transition-colors"
        >
          Sign in now
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-cream-50 ring-1 ring-cream-200 p-6 sm:p-8 lg:p-10 shadow-[0_30px_70px_-40px_rgba(87,34,44,0.4)]">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid place-items-center h-11 w-11 rounded-full bg-wine-600 text-cream-50">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-semibold text-wine-700">
            Vendor portal
          </h3>
          <p className="text-sm text-ink-700/70">
            {mode === 'signup' ? 'Open a shop and start selling hampers' : 'Welcome back, vendor'}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-cream-100 p-1">
        {(['signup', 'login'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full py-2.5 text-sm font-medium capitalize transition-all ${
              mode === m ? 'bg-wine-600 text-cream-50 shadow-sm' : 'text-ink-700/70 hover:text-wine-700'
            }`}
          >
            {m === 'signup' ? 'Sign up' : 'Log in'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        {mode === 'signup' && (
          <Field icon={<UserRound className="h-4 w-4" />} label="Business name">
            <input
              required
              autoComplete="off"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="A_S Hamper Co."
              className="input"
            />
          </Field>
        )}

        <Field icon={<Mail className="h-4 w-4" />} label="Email">
          <input
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@shop.in"
            className="input"
          />
        </Field>

        <Field icon={<Lock className="h-4 w-4" />} label="Password">
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="input"
          />
        </Field>

        {mode === 'login' && (
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-wine-700 hover:underline dark:text-gold-300"
            >
              Forgot Password?
            </Link>
          </div>
        )}

        {mode === 'signup' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field icon={<Hash className="h-4 w-4" />} label="Shop no.">
              <input
                required
                value={shopNo}
                onChange={(e) => setShopNo(e.target.value)}
                placeholder="SHOP-0142"
                className="input"
              />
            </Field>
            <Field icon={<FileText className="h-4 w-4" />} label="GST no.">
              <input
                required
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
                className="input"
              />
            </Field>
            <Field icon={<Phone className="h-4 w-4" />} label="Phone">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input"
              />
            </Field>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine-600 py-3.5 text-sm font-semibold text-cream-50 transition-all hover:bg-wine-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {mode === 'signup' ? 'Create vendor account' : 'Sign in'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cream-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-cream-50 text-ink-700/60">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-cream-300 bg-white py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Google
        </button>
      </form>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-700/60">
        <span className="text-gold-600">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
