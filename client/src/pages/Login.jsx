import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, sendVerifyOtp, verifyEmail } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If login returns needsVerification, show OTP screen
  const [step, setStep] = useState('login'); // 'login' | 'verify'
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login({ email, password });
      setAuth(data.user, data.token);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      const res = err.response?.data;
      // Server told us this account needs verification
      if (res?.needsVerification) {
        setUnverifiedEmail(res.email || email);
        // Automatically send a fresh OTP
        try {
          await sendVerifyOtp(res.email || email);
          toast('Please verify your email first. We sent you a code.', { icon: '📧' });
        } catch {
          // OTP send failed silently — user can still request resend
        }
        setStep('verify');
      } else {
        toast.error(res?.message || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const data = await verifyEmail(unverifiedEmail, otp);
      setAuth(data.user, data.token);
      toast.success(data.message);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await sendVerifyOtp(unverifiedEmail);
      toast.success('New code sent!');
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  }

  // ── Verify screen ──────────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <svg className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mb-1 text-2xl font-bold text-slate-900">Verify your email</h1>
          <p className="mb-6 text-sm text-slate-500">
            Code sent to <span className="font-medium text-slate-700">{unverifiedEmail}</span>
          </p>
          <form onSubmit={handleVerify} className="space-y-4 text-left">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {verifying ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            Didn't receive it?{' '}
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="font-medium text-teal-600 hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </p>
          <button
            type="button"
            onClick={() => setStep('login')}
            className="mt-3 text-xs text-slate-400 hover:underline"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Login screen (unchanged visually) ─────────────────────────────────────
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Sign in to MedSync</h1>
      <p className="mb-8 text-center text-slate-600">Manage medicines and QR for your family.</p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        No account?{' '}
        <Link to="/register" className="font-medium text-teal-700 hover:underline">Register</Link>
      </p>
    </div>
  );
}