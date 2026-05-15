import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { login, register, requestPasswordOtp, resetPasswordWithOtp, sendVerifyOtp, verifyEmail } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // ── NEW: Email verification state ─────────────────────────────────────────
  const [verifyStep, setVerifyStep] = useState(false); // show OTP screen?
  const [pendingEmail, setPendingEmail] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const loginFn = useAuthStore((s) => s.login);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const demoHint = useMemo(() => 'Demo: demo@medsync.np / demo1234', []);

  // ── Login ──────────────────────────────────────────────────────────────────
  async function onSubmitLogin(values) {
    setFormError('');
    setSubmitting(true);
    try {
      const data = await login(values);
      loginFn(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      const res = err?.response?.data;
      // Account exists but email not verified
      if (res?.needsVerification) {
        setPendingEmail(res.email || values.email);
        try {
          await sendVerifyOtp(res.email || values.email);
          toast('Please verify your email first. A code has been sent.', { icon: '📧' });
        } catch {
          // silent — user can resend
        }
        setVerifyStep(true);
      } else {
        const message = res?.message || err?.message || 'Login failed';
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function onSubmitRegister(values) {
    setFormError('');
    setSubmitting(true);
    try {
      const name = `${values.firstName} ${values.lastName}`.trim();
      // Server now returns { message, email } instead of token
      const data = await register({ name, email: values.email, password: values.password });
      setPendingEmail(data.email || values.email);
      setVerifyStep(true);
      toast.success('Account created! Check your email for the verification code.');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Registration failed';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Verify OTP submit ──────────────────────────────────────────────────────
  async function handleVerify(e) {
    e.preventDefault();
    if (verifyOtp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const data = await verifyEmail(pendingEmail, verifyOtp);
      loginFn(data.user, data.token);
      toast.success(data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  async function handleResend() {
    setResending(true);
    try {
      await sendVerifyOtp(pendingEmail);
      toast.success('New code sent! Check your email.');
      setVerifyOtp('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  }

  // ── OTP Verification screen ────────────────────────────────────────────────
  if (verifyStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-[24px]">
        <div className="w-full max-w-[400px] rounded-[20px] bg-card p-[40px] shadow-modal text-center">
          {/* Icon */}
          <div className="mx-auto mb-[20px] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-mint/10">
            <svg className="h-[28px] w-[28px] text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="font-display text-[22px] font-bold text-navy mb-[6px]">
            Check your email
          </div>
          <div className="text-[13px] text-muted mb-[28px]">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-navy">{pendingEmail}</span>
          </div>

          <form onSubmit={handleVerify} className="space-y-[14px]">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={verifyOtp}
              onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-btn border-[1.5px] border-border bg-bg px-[15px] py-[14px] text-center text-[28px] font-bold tracking-[0.5em] text-navy outline-none transition-colors focus:border-mint"
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-navy text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer hover:bg-navy-mid active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {verifying ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <div className="mt-[16px] text-[13px] text-muted">
            Didn't receive it?{' '}
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="text-mint-mid font-semibold underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </div>

          <div className="mt-[8px] text-[11px] text-muted/60">Code expires in 10 minutes</div>

          <button
            type="button"
            onClick={() => { setVerifyStep(false); setVerifyOtp(''); }}
            className="mt-[14px] text-[12px] text-muted hover:underline"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main login/register screen (completely unchanged visually) ─────────────
  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <aside className="hidden w-[420px] min-h-screen flex-col justify-center bg-navy px-[48px] py-[60px] relative overflow-hidden md:flex">
        <div className="absolute -top-[80px] -right-[80px] h-[300px] w-[300px] rounded-full bg-[rgba(0,200,150,0.08)] pointer-events-none" />
        <div className="absolute -bottom-[60px] -left-[60px] h-[220px] w-[220px] rounded-full bg-[rgba(0,200,150,0.05)] pointer-events-none" />

        <div className="mb-[52px]">
          <div className="flex items-center gap-[12px]">
            <div className="h-[44px] w-[44px] rounded-[12px] bg-mint flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"
                  stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="font-display text-[17px] font-bold text-white">MedSync</div>
          </div>
        </div>

        <h1 className="text-[32px] font-display font-bold text-white leading-[1.2] tracking-[-0.5px] mb-[18px]">
          Your medicines, always in the right hands.
        </h1>
        <p className="text-[15px] font-body text-[rgba(255,255,255,0.7)] leading-[1.6]">
          Show a single QR code at any pharmacy. The pharmacist sees exact medicine, dose, and prescription — no errors.
        </p>

        <div className="mt-[36px] flex flex-wrap gap-[8px]">
          {['QR-based', 'Stock tracking', 'Auto-alerts', 'Family accounts'].map((t) => (
            <span key={t} className="px-[13px] py-[5px] rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[rgba(255,255,255,0.65)]">
              {t}
            </span>
          ))}
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <section className="flex-1 bg-bg flex items-center justify-center px-[24px] py-[40px]">
        <div className="w-full max-w-[400px]">

          {/* Mobile mini logo */}
          <div className="md:hidden mb-[22px] flex items-center gap-[12px]">
            <div className="h-[38px] w-[38px] rounded-[12px] bg-mint flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"
                  stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="font-display text-[17px] font-bold text-navy">MedSync</div>
          </div>

          <h2 className="font-display text-[28px] font-bold tracking-[-0.4px] text-navy mb-[6px]">
            {mode === 'login' ? 'Sign In' : 'Register'}
          </h2>
          <p className="text-[14px] font-body text-muted mb-[32px]">
            {mode === 'login' ? 'Welcome back! Enter your details.' : 'Create an account to start tracking medicines.'}
          </p>

          {/* Tab switcher */}
          <div className="flex gap-[4px] bg-bg rounded-[14px] p-[5px] mb-[26px]">
            <button type="button" onClick={() => setMode('login')}
              className={`flex-1 px-[8px] py-[10px] rounded-[10px] font-body text-[13px] font-semibold cursor-pointer transition-all ${
                mode === 'login' ? 'bg-card text-navy shadow-sm' : 'bg-transparent text-muted hover:text-navy'
              }`}>
              Sign In
            </button>
            <button type="button" onClick={() => setMode('register')}
              className={`flex-1 px-[8px] py-[10px] rounded-[10px] font-body text-[13px] font-semibold cursor-pointer transition-all ${
                mode === 'register' ? 'bg-card text-navy shadow-sm' : 'bg-transparent text-muted hover:text-navy'
              }`}>
              Register
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-[18px]">
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Email</label>
                <input type="email" {...loginForm.register('email')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                {loginForm.formState.errors.email && (
                  <div className="mt-[7px] text-[12px] text-red font-semibold">{loginForm.formState.errors.email.message}</div>
                )}
              </div>
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Password</label>
                <input type="password" {...loginForm.register('password')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                {loginForm.formState.errors.password && (
                  <div className="mt-[7px] text-[12px] text-red font-semibold">{loginForm.formState.errors.password.message}</div>
                )}
              </div>
              {formError && <div className="text-[12px] text-red font-semibold">{formError}</div>}
              <button type="submit" disabled={submitting}
                className="w-full bg-navy text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer hover:bg-navy-mid active:scale-[0.98] transition-all disabled:opacity-60">
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
              <button type="button" className="w-full text-[12px] text-mint-mid underline"
                onClick={() => { setForgotOpen(true); setOtpSent(false); setForgotEmail(loginForm.getValues('email') || ''); setResetOtp(''); setNewPassword(''); }}>
                Forgot password?
              </button>
              <div className="mt-[10px] text-[12px] text-muted text-center bg-[#f0f2f8] py-[10px] px-[14px] rounded-[10px]">
                {demoHint}
              </div>
            </form>

          ) : (
            /* ── REGISTER FORM ── */
            <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-[18px]">
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">First name</label>
                  <input type="text" {...registerForm.register('firstName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerForm.formState.errors.firstName && (
                    <div className="mt-[7px] text-[12px] text-red font-semibold">{registerForm.formState.errors.firstName.message}</div>
                  )}
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Last name</label>
                  <input type="text" {...registerForm.register('lastName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerForm.formState.errors.lastName && (
                    <div className="mt-[7px] text-[12px] text-red font-semibold">{registerForm.formState.errors.lastName.message}</div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Email</label>
                <input type="email" {...registerForm.register('email')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                {registerForm.formState.errors.email && (
                  <div className="mt-[7px] text-[12px] text-red font-semibold">{registerForm.formState.errors.email.message}</div>
                )}
              </div>
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Password</label>
                <input type="password" {...registerForm.register('password')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                {registerForm.formState.errors.password && (
                  <div className="mt-[7px] text-[12px] text-red font-semibold">{registerForm.formState.errors.password.message}</div>
                )}
              </div>
              {formError && <div className="text-[12px] text-red font-semibold">{formError}</div>}
              <button type="submit" disabled={submitting}
                className="w-full bg-navy text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer hover:bg-navy-mid active:scale-[0.98] transition-all disabled:opacity-60">
                {submitting ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FORGOT PASSWORD MODAL (completely unchanged) ── */}
      {forgotOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}
          role="dialog" aria-modal="true">
          <div className="relative w-full max-w-[420px] rounded-[16px] bg-card p-[26px] shadow-modal">
            <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Forgot Password</div>
            <div className="text-[13px] text-muted mb-[18px]">Get OTP on your email and reset password.</div>

            <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Email</label>
            <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />

            {otpSent && (
              <>
                <label className="mt-[12px] mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">OTP</label>
                <input value={resetOtp} onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                <label className="mt-[12px] mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
              </>
            )}

            <div className="mt-[16px] flex gap-[8px]">
              <button type="button" onClick={() => setForgotOpen(false)}
                className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer">
                Cancel
              </button>
              {!otpSent ? (
                <button type="button"
                  className="flex-1 rounded-btn bg-navy text-white py-[10px] text-[13px] font-semibold"
                  onClick={async () => {
                    try {
                      await requestPasswordOtp({ email: forgotEmail });
                      setOtpSent(true);
                      toast.success('OTP sent to email');
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Could not send OTP');
                    }
                  }}>
                  Send OTP
                </button>
              ) : (
                <button type="button"
                  className="flex-1 rounded-btn bg-mint text-white py-[10px] text-[13px] font-semibold"
                  onClick={async () => {
                    try {
                      await resetPasswordWithOtp({ email: forgotEmail, otp: resetOtp, newPassword });
                      toast.success('Password reset successful');
                      setForgotOpen(false);
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Reset failed');
                    }
                  }}>
                  Reset Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}