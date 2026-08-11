import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setLoading(true);

    try {
      if (supabase) {
        const redirectUrl = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });

        if (error) {
          console.warn('Supabase resetPasswordForEmail notice:', error.message);
        }
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <main className="min-h-screen bg-cream-50/60 dark:bg-gray-900 pt-28 pb-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center transition-colors">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-wine-700 hover:text-wine-800 dark:text-gold-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>

        <div className="rounded-3xl border border-cream-200 bg-white p-6 sm:p-8 shadow-xl dark:border-gray-800 dark:bg-gray-800">
          {!submitted ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-wine-600/10 text-wine-600 dark:bg-wine-600/20 dark:text-gold-300">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-wine-800 dark:text-white">
                    Forgot Password?
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Reset your account password
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="Enter your email"
                      className="w-full rounded-2xl border border-cream-300 bg-cream-50/50 pl-10 pr-4 py-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine-600 py-3 text-xs font-bold text-white shadow-lg shadow-wine-600/30 transition-all hover:bg-wine-700 active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-cream-200 dark:border-gray-700 pt-4 text-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">Remember your password? </span>
                <Link to="/profile" className="font-bold text-wine-600 hover:underline dark:text-gold-300">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* Generic Security Success Message (Requirements 6 & 18) */
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage-500/15 text-sage-600 dark:text-sage-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="font-display text-xl font-bold text-wine-800 dark:text-white">
                Check your email
              </h2>

              <div className="rounded-2xl bg-cream-50 p-4 border border-cream-200 dark:bg-gray-700/60 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-left space-y-2">
                <p className="font-semibold text-wine-800 dark:text-gold-300">
                  If an account exists for {email}, you will receive a password reset link shortly.
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Please check your inbox (and spam folder) and follow the instructions to create a new password.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full rounded-full border border-cream-300 bg-white py-2.5 text-xs font-semibold text-wine-800 hover:bg-cream-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  Didn't receive the email? Resend
                </button>
                <Link
                  to="/profile"
                  className="block w-full rounded-full bg-wine-600 py-2.5 text-xs font-bold text-white shadow hover:bg-wine-700"
                >
                  Back to Login
                </Link>
              </div>

              <div className="pt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                <ShieldCheck className="h-3 w-3 text-sage-600" />
                <span>Protected by Supabase Encrypted Authentication</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
