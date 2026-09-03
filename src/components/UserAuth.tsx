import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone, UserRound, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import PasswordField, { isStrongPassword } from '@/components/PasswordField';
import { checkRoleCollision, triggerGoogleSignIn, validateSessionRole } from '@/lib/authHelpers';
import { sanitizeInput, validatePhoneNumber, validateEmailFormat } from '@/lib/security';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import OtpVerificationModal from '@/components/OtpVerificationModal';
import { toast } from 'react-hot-toast';

type Mode = 'login' | 'signup';

export default function UserAuth() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Check if session role validation failed or redirect error exists
    validateSessionRole().then((roleErr) => {
      if (roleErr) {
        setError(roleErr);
      } else {
        const redirectError = sessionStorage.getItem('a_s_hamper_auth_error');
        if (redirectError) {
          setError(redirectError);
          sessionStorage.removeItem('a_s_hamper_auth_error');
        }
      }
    });
  }, []);

  async function sendLoginAlert() {
    if (!supabase) return;
    await supabase.functions.invoke('login-alert');
  }

  async function requestPasswordReset() {
    if (!supabase || !email) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile?reset=1` });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      toast.error(resetError.message);
    } else {
      setResetSent(true);
      toast.success('Password reset link sent to your email.');
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await triggerGoogleSignIn('user', '/');
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
              {session.user.email}
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
      setError('Authentication not configured. Please check environment variables.');
      setLoading(false);
      return;
    }

    try {
      if (!validateEmailFormat(email)) {
        throw new Error('Please enter a valid email address (e.g. name@gmail.com).');
      }

      // Check cross-role collision before attempting login/signup
      const collisionMsg = await checkRoleCollision(email, 'user');
      if (collisionMsg) {
        setError(collisionMsg);
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const phoneValidation = validatePhoneNumber(phone, countryCode);
        if (!phoneValidation.valid) {
          throw new Error(phoneValidation.error || 'Please enter a valid mobile number.');
        }
        if (password !== confirmPassword) {
          throw new Error('Password and Confirm Password do not match.');
        }
        if (!isStrongPassword(password)) throw new Error('Use at least 8 characters with uppercase, lowercase, and a number.');
        
        const cleanName = sanitizeInput(name);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_type: 'user',
              full_name: cleanName,
              phone: phoneValidation.fullPhone,
            },
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('sending confirmation email') || msg.includes('confirmation email') || msg.includes('smtp')) {
            console.warn('Supabase email notice:', error.message);
          } else {
            throw error;
          }
        }
        if (data.user?.identities?.length === 0) {
          throw new Error('An account with this email already exists. Please log in instead.');
        }

        sessionStorage.setItem('a_s_hamper_verify_email', email);
        sessionStorage.setItem('a_s_hamper_verify_role', 'customer');
        toast.success('Account created! Please enter verification code.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}&role=customer`);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check if email has been confirmed via OTP
        const isEmailConfirmed = !!(data.user.email_confirmed_at);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email_verified')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!isEmailConfirmed && !profile?.email_verified) {
          await supabase.auth.signOut();
          sessionStorage.setItem('a_s_hamper_verify_email', email);
          sessionStorage.setItem('a_s_hamper_verify_role', 'customer');
          toast.error('Please verify your email address to continue.');
          navigate(`/verify-email?email=${encodeURIComponent(email)}&role=customer`);
          return;
        }

        if (profile?.role && profile.role !== 'user') {
          await supabase.auth.signOut();
          const roleName = profile.role === 'vendor' ? 'Vendor' : 'Admin';
          const portalName = profile.role === 'vendor' ? 'Vendor Portal' : 'Admin Portal';
          throw new Error(`This email is registered as a ${roleName}. Please sign in using the ${portalName}.`);
        }

        void sendLoginAlert();
        toast.success('Signed in successfully! Welcome back.');
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast.error(msg);
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
          Your account was created. Check your email to confirm it if requested, then sign in to start shopping.
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
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-semibold text-wine-700">
            Customer account
          </h3>
          <p className="text-sm text-ink-700/70">
            {mode === 'signup' ? 'Create an account to track orders' : 'Welcome back, customer'}
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

      <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
        {mode === 'signup' && (
          <Field icon={<UserRound className="h-4 w-4" />} label="Name">
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="input"
            />
          </Field>
        )}

        {mode === 'signup' && (
          <Field icon={<Phone className="h-4 w-4" />} label="Mobile Number">
            <CountryPhoneInput
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              phone={phone}
              onPhoneChange={setPhone}
            />
          </Field>
        )}

        <Field icon={<Mail className="h-4 w-4" />} label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="input"
          />
        </Field>

        <Field icon={<Lock className="h-4 w-4" />} label="Password">
          <PasswordField value={password} onChange={setPassword} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} showStrength={mode === 'signup'} placeholder={mode === 'signup' ? 'Create a strong password' : 'Your password'} />
        </Field>

        {mode === 'signup' && (
          <Field icon={<Lock className="h-4 w-4" />} label="Confirm Password">
            <PasswordField value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Re-enter password" />
          </Field>
        )}

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
              {mode === 'signup' ? 'Create account' : 'Sign in'}
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
        <OtpVerificationModal
          isOpen={showOtpModal}
          email={email}
          phone={`${countryCode}${phone}`}
          onSuccess={() => {
            setShowOtpModal(false);
            setDone(true);
          }}
          onClose={() => setShowOtpModal(false)}
        />
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
