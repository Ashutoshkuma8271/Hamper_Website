import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import PasswordField from '@/components/PasswordField';
import { checkRoleCollision, triggerGoogleSignIn, validateSessionRole } from '@/lib/authHelpers';

type Mode = 'login' | 'signup';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    validateSessionRole().then((roleErr) => {
      if (roleErr) setError(roleErr);
    });
  }, []);

  async function requestPasswordReset() {
    if (!supabase || !email) { setError('Enter your email address first.'); return; }
    setLoading(true); setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile?reset=1` });
    setLoading(false);
    if (resetError) setError(resetError.message); else setResetSent(true);
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await triggerGoogleSignIn('admin', '/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    if (!supabase) {
      setError('Authentication is not configured. Please check the environment variables.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') throw new Error('The administrator account is already configured. Please use Admin login.');

      const collisionMsg = await checkRoleCollision(email, 'admin');
      if (collisionMsg) {
        setError(collisionMsg);
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        const roleName = profile?.role === 'vendor' ? 'Vendor' : 'Customer';
        const portalName = profile?.role === 'vendor' ? 'Vendor Portal' : 'Customer Account';
        setError(`This email is registered as a ${roleName}. Please sign in using the ${portalName}.`);
      } else {
        void supabase.functions.invoke('login-alert');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return <section className="rounded-3xl bg-cream-50 p-6 ring-1 ring-cream-200 shadow-[0_30px_70px_-40px_rgba(87,34,44,0.4)] sm:p-8 lg:p-10 dark:bg-gray-800 dark:ring-gray-700">
    <div className="mb-6 flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-wine-700 text-cream-50"><ShieldCheck className="h-5 w-5" /></span>
      <div><h3 className="font-display text-xl font-semibold text-wine-700 dark:text-white">Admin account</h3><p className="text-sm text-ink-700/70 dark:text-gray-300">Secure access for your store administrators</p></div>
    </div>
    <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-cream-100 p-1 dark:bg-gray-700">
      {(['signup', 'login'] as Mode[]).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(null); }} className={`rounded-full py-2.5 text-sm font-medium capitalize transition-all ${mode === item ? 'bg-wine-700 text-cream-50 shadow-sm' : 'text-ink-700/70 hover:text-wine-700 dark:text-gray-300'}`}>{item === 'signup' ? 'Sign up' : 'Log in'}</button>)}
    </div>
    <form onSubmit={submit} autoComplete="on" className="space-y-4">
      {mode === 'signup' ? <div className="rounded-2xl bg-gold-500/10 p-5 text-sm text-ink-700/75"><UserRound className="mb-3 h-5 w-5 text-gold-600" /><p className="font-semibold text-wine-700">Administrator already configured</p><p className="mt-1">For security, this store allows only its configured administrator account. Please switch to Admin login.</p></div> : <><Field icon={<Mail className="h-4 w-4" />} label="Email"><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className="input" /></Field><Field icon={<LockKeyhole className="h-4 w-4" />} label="Password"><PasswordField value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" /></Field><div className="flex justify-end"><Link to="/forgot-password" className="text-xs font-semibold text-wine-700 hover:underline dark:text-gold-300">Forgot Password?</Link></div></>}
      {resetSent && <p className="rounded-xl bg-sage-500/10 px-4 py-3 text-sm text-sage-700">Password reset link sent. Check your email inbox.</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-wine-700 py-3.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-wine-800 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === 'signup' ? 'Use Admin login' : 'Sign in as admin'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</button>

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
        Google Admin Sign In
      </button>
    </form>
  </section>;
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-700/60 dark:text-gray-400"><span className="text-gold-600">{icon}</span>{label}</span>{children}</label>;
}
