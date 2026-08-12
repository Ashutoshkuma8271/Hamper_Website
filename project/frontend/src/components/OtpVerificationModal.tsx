import { useState } from 'react';
import { Mail, CheckCircle2, Loader2, ArrowRight, X, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface OtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  phone?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function OtpVerificationModal({
  isOpen,
  email,
  phone,
  onSuccess,
  onClose,
}: OtpVerificationModalProps) {
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError('Authentication system unavailable.');
      setLoading(false);
      return;
    }

    const cleanToken = otpToken.trim();
    if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      setError('Please enter a valid 6-digit numeric OTP code.');
      setLoading(false);
      return;
    }

    try {
      // 1. Try Email Signup OTP Verification
      let verifyRes = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: 'signup',
      });

      // 2. Fallback to Email Magic Link / Magic Code
      if (verifyRes.error) {
        verifyRes = await supabase.auth.verifyOtp({
          email,
          token: cleanToken,
          type: 'email',
        });
      }

      // 3. Fallback to Phone OTP Verification if phone is provided
      if (verifyRes.error && phone) {
        verifyRes = await supabase.auth.verifyOtp({
          phone,
          token: cleanToken,
          type: 'sms',
        });
      }

      if (verifyRes.error) {
        throw new Error(verifyRes.error.message || 'Invalid or expired OTP verification code.');
      }

      toast.success('Account & Email verified successfully! Welcome to A_S Hamper.', { icon: '🎉' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!supabase) return;
    setResending(true);
    setError(null);
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendErr) throw resendErr;
      toast.success(`Verification code re-sent to ${email}`, { icon: '📩' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-md rounded-3xl bg-cream-50 p-6 sm:p-8 shadow-2xl ring-1 ring-cream-200 dark:bg-gray-800 dark:ring-gray-700">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-cream-200/60 text-ink-700/60 hover:bg-cream-300 dark:bg-gray-700 dark:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-wine-600/10 text-wine-600 dark:bg-gold-500/20 dark:text-gold-300 mx-auto">
            <KeyRound className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-wine-800 dark:text-white">
            Verify Email &amp; Phone OTP
          </h2>
          <p className="mt-2 text-xs text-ink-700/70 dark:text-gray-300 max-w-xs mx-auto">
            We sent a 6-digit verification code to <strong className="text-wine-700 dark:text-gold-300">{email}</strong>
            {phone && <span> and <strong className="text-wine-700 dark:text-gold-300">{phone}</strong></span>}.
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="block text-center text-xs font-semibold text-ink-700/80 dark:text-gray-300 uppercase tracking-wider mb-2">
              Enter 6-Digit OTP Code
            </label>
            <input
              required
              type="text"
              maxLength={6}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold rounded-2xl border-2 border-wine-600/40 bg-white py-3 text-wine-800 outline-none focus:border-wine-600 dark:border-gold-500/50 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 text-red-700 text-xs px-3.5 py-2.5 dark:bg-red-950/40 dark:text-red-300 text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otpToken.length !== 6}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-wine-700 disabled:opacity-60 transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Verify &amp; Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-ink-700/60 dark:text-gray-400">
          Didn't receive code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-bold text-wine-700 hover:underline dark:text-gold-300"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
