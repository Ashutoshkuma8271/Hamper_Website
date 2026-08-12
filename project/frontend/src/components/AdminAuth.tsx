import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import PasswordField, { isStrongPassword } from '@/components/PasswordField';
import { checkRoleCollision, triggerGoogleSignIn, validateSessionRole } from '@/lib/authHelpers';
import { sanitizeInput, validateEmailFormat, checkRateLimit } from '@/lib/security';
import OtpVerificationModal from '@/components/OtpVerificationModal';

type Mode = 'login' | 'signup' | 'forgot';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    validateSessionRole().then((roleErr) => {
      if (roleErr) setError(roleErr);
    });
  }, []);

  async function requestPasswordReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!supabase || !email) {
      setError('Please enter your registered Admin email address.');
      return;
    }

    if (!validateEmailFormat(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/profile?reset=1`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
      setSuccessMsg('Password reset instructions sent to your Admin Gmail inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await triggerGoogleSignIn('admin', '/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!checkRateLimit('admin_auth_submit', 1500)) {
      setError('Please wait a moment before trying again.');
      return;
    }

    if (!supabase) {
      setError('Authentication system unavailable.');
      return;
    }

    const cleanEmail = email.trim();
    if (!validateEmailFormat(cleanEmail)) {
      setError('Please enter a valid Admin email address (e.g. admin@yourdomain.com).');
      return;
    }

    setLoading(true);

    try {
      // Check cross-role collision before attempting login/signup
      const collisionMsg = await checkRoleCollision(cleanEmail, 'admin');
      if (collisionMsg) {
        setError(collisionMsg);
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        // --- 1. ADMIN SIGNUP FLOW ---
        const cleanName = sanitizeInput(name);
        if (!cleanName) {
          throw new Error('Please enter your Full Name.');
        }

        if (password !== confirmPassword) {
          throw new Error('Password and Confirm Password do not match.');
        }

        if (!isStrongPassword(password)) {
          throw new Error('Password must be at least 8 characters with uppercase, lowercase, and a number.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              account_type: 'admin',
              full_name: cleanName,
            },
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.user?.identities?.length === 0) {
          throw new Error('An account with this email already exists. Please log in instead.');
        }

        sessionStorage.setItem('a_s_hamper_verify_email', cleanEmail);
        sessionStorage.setItem('a_s_hamper_verify_role', 'admin');
        navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}&role=admin`);
      } else {
        // --- 2. DEDICATED ADMIN LOGIN FLOW ---
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) throw signInError;

        // Fetch server-side role and account status from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, account_status, email_verified')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Check if email is verified
        if (!data.user.email_confirmed_at && !profile?.email_verified) {
          await supabase.auth.signOut();
          sessionStorage.setItem('a_s_hamper_verify_email', cleanEmail);
          sessionStorage.setItem('a_s_hamper_verify_role', 'admin');
          navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}&role=admin`);
          return;
        }

        if (profile?.role !== 'admin') {
          await supabase.auth.signOut();
          const roleName = profile?.role === 'vendor' ? 'Vendor' : 'Customer';
          const portalName = profile?.role === 'vendor' ? 'Vendor Portal' : 'Customer Account';
          throw new Error(`Access Denied: This email is registered as a ${roleName}. Please sign in using the ${portalName}.`);
        }

        if (profile?.account_status === 'inactive' || profile?.account_status === 'suspended') {
          await supabase.auth.signOut();
          throw new Error('Your Admin account is currently inactive. Please contact store management.');
        }

        // Login verified & active -> proceed to Admin Dashboard
        void supabase.functions.invoke('login-alert');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong during Admin authentication.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl bg-cream-50 p-6 ring-1 ring-cream-200 shadow-[0_30px_70px_-40px_rgba(87,34,44,0.4)] sm:p-8 lg:p-10 dark:bg-gray-800 dark:ring-gray-700 font-sans">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-wine-700 text-cream-50 shadow-md">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold text-wine-800 dark:text-white">
            Admin Security Portal
          </h3>
          <p className="text-xs text-ink-700/70 dark:text-gray-300">
            Protected access for authorized store administrators
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-cream-100 p-1 dark:bg-gray-700">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`rounded-full py-2.5 text-sm font-medium transition-all ${
            mode === 'login'
              ? 'bg-wine-700 text-cream-50 shadow-sm'
              : 'text-ink-700/70 hover:text-wine-700 dark:text-gray-300'
          }`}
        >
          Admin Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`rounded-full py-2.5 text-sm font-medium transition-all ${
            mode === 'signup'
              ? 'bg-wine-700 text-cream-50 shadow-sm'
              : 'text-ink-700/70 hover:text-wine-700 dark:text-gray-300'
          }`}
        >
          Admin Signup
        </button>
      </div>

      {mode === 'forgot' ? (
        <form onSubmit={requestPasswordReset} className="space-y-4">
          <p className="text-xs text-ink-700/75 dark:text-gray-300">
            Enter your registered Admin email address to receive password reset instructions via Gmail.
          </p>
          <Field icon={<Mail className="h-4 w-4" />} label="Admin Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="input"
            />
          </Field>

          {error && <p className="rounded-xl bg-red-50 text-red-700 text-xs px-4 py-3 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          {successMsg && <p className="rounded-xl bg-emerald-50 text-emerald-800 text-xs px-4 py-3 dark:bg-emerald-950/40 dark:text-emerald-300">{successMsg}</p>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className="text-xs font-semibold text-wine-700 hover:underline dark:text-gold-300"
            >
              ← Back to Admin Login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-wine-700 px-6 py-2.5 text-xs font-semibold text-white hover:bg-wine-800 disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submit} autoComplete="on" className="space-y-4">
          {mode === 'signup' && (
            <Field icon={<UserRound className="h-4 w-4" />} label="Full Name">
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Full Name"
                className="input"
              />
            </Field>
          )}

          <Field icon={<Mail className="h-4 w-4" />} label="Admin Email Address">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="input"
            />
          </Field>

          <Field icon={<LockKeyhole className="h-4 w-4" />} label="Password">
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="Min 8 chars (uppercase, lowercase, number)"
            />
          </Field>

          {mode === 'signup' && (
            <Field icon={<LockKeyhole className="h-4 w-4" />} label="Confirm Password">
              <PasswordField
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
            </Field>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(null); }}
                className="text-xs font-semibold text-wine-700 hover:underline dark:text-gold-300"
              >
                Forgot Admin Password?
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 text-red-700 text-xs px-4 py-3 dark:bg-red-950/40 dark:text-red-300 font-medium">
              {error}
            </p>
          )}

          {successMsg && (
            <p className="rounded-xl bg-emerald-50 text-emerald-800 text-xs px-4 py-3 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-wine-700 py-3.5 text-sm font-semibold text-cream-50 transition-all hover:bg-wine-800 disabled:opacity-60 shadow-md"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === 'signup' ? 'Create Admin Account & Verify OTP' : 'Sign in to Admin Dashboard'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-cream-50 dark:bg-gray-800 text-ink-700/60 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-cream-300 bg-white py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google Admin Sign In
          </button>
        </form>
      )}

      {/* 6-Digit Admin Gmail OTP Verification Screen Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        email={email}
        title="Admin Gmail OTP Verification"
        onSuccess={() => {
          setShowOtpModal(false);
          setSuccessMsg('Email verified successfully! You can now log in to your Admin account.');
          setMode('login');
        }}
        onClose={() => setShowOtpModal(false)}
      />
    </section>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-700/60 dark:text-gray-400">
        <span className="text-gold-600">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
