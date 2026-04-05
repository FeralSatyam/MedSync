import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { login, register, requestPasswordOtp, resetPasswordWithOtp } from '../api/authApi';
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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  const demoHint = useMemo(
    () => 'Demo: demo@medsync.np / demo1234',
    []
  );

  async function onSubmitLogin(values) {
    setFormError('');
    setSubmitting(true);
    try {
      const data = await login(values);
      loginFn(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Login failed';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitRegister(values) {
    setFormError('');
    setSubmitting(true);
    try {
      const name = `${values.firstName} ${values.lastName}`.trim();
      const data = await register({ name, email: values.email, password: values.password });
      loginFn(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Registration failed';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

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
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="font-display text-[17px] font-bold text-white">MedSync</div>
          </div>
        </div>

        <h1 className="text-[30px] font-display font-semibold text-white leading-[1.3] mb-[18px]">
          Your medicines, always in the right hands.
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.5)] leading-[1.75]">
          Show a single QR code at any pharmacy. The pharmacist sees exact medicine, dose, and prescription —
          no errors.
        </p>

        <div className="mt-[36px] flex flex-wrap gap-[8px]">
          {['QR-based', 'Stock tracking', 'Auto-alerts', 'Family accounts'].map((t) => (
            <span
              key={t}
              className="px-[13px] py-[5px] rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[rgba(255,255,255,0.65)]"
            >
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
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="font-display text-[17px] font-bold text-navy">MedSync</div>
          </div>

          <h2 className="font-display text-[26px] font-bold text-navy mb-[5px]">
            {mode === 'login' ? 'Sign In' : 'Register'}
          </h2>
          <p className="text-[14px] text-muted mb-[28px]">
            {mode === 'login'
              ? 'Welcome back! Enter your details.'
              : 'Create an account to start tracking medicines.'}
          </p>

          {/* Tab switcher */}
          <div className="flex gap-[4px] bg-bg rounded-[10px] p-[4px] mb-[22px]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 px-[8px] py-[8px] rounded-[7px] text-[13px] cursor-pointer transition-all ${
                mode === 'login'
                  ? 'bg-card text-navy font-medium shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                  : 'bg-transparent text-muted'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 px-[8px] py-[8px] rounded-[7px] text-[13px] cursor-pointer transition-all ${
                mode === 'register'
                  ? 'bg-card text-navy font-medium shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                  : 'bg-transparent text-muted'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-[18px]">
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">
                  Email
                </label>
                <input
                  type="email"
                  {...loginForm.register('email')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
                {loginForm.formState.errors.email ? (
                  <div className="mt-[7px] block text-[12px] text-red font-semibold">
                    {loginForm.formState.errors.email.message}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">
                  Password
                </label>
                <input
                  type="password"
                  {...loginForm.register('password')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
                {loginForm.formState.errors.password ? (
                  <div className="mt-[7px] block text-[12px] text-red font-semibold">
                    {loginForm.formState.errors.password.message}
                  </div>
                ) : null}
              </div>

              {formError ? (
                <div className="text-[12px] text-red mt-[7px] font-semibold">{formError}</div>
              ) : (
                <div className="hidden" />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-navy text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer hover:bg-navy-mid active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                className="w-full text-[12px] text-mint-mid underline"
                onClick={() => {
                  setForgotOpen(true);
                  setOtpSent(false);
                  setForgotEmail(loginForm.getValues('email') || '');
                  setOtp('');
                  setNewPassword('');
                }}
              >
                Forgot password?
              </button>

              <div className="mt-[10px] text-[12px] text-muted text-center bg-[#f0f2f8] py-[10px] px-[14px] rounded-[10px]">
                {demoHint}
              </div>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-[18px]">
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">
                    First name
                  </label>
                  <input
                    type="text"
                    {...registerForm.register('firstName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                  />
                  {registerForm.formState.errors.firstName ? (
                    <div className="mt-[7px] block text-[12px] text-red font-semibold">
                      {registerForm.formState.errors.firstName.message}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">
                    Last name
                  </label>
                  <input
                    type="text"
                    {...registerForm.register('lastName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                  />
                  {registerForm.formState.errors.lastName ? (
                    <div className="mt-[7px] block text-[12px] text-red font-semibold">
                      {registerForm.formState.errors.lastName.message}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">
                  Email
                </label>
                <input
                  type="email"
                  {...registerForm.register('email')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
                {registerForm.formState.errors.email ? (
                  <div className="mt-[7px] block text-[12px] text-red font-semibold">
                    {registerForm.formState.errors.email.message}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">
                  Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('password')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
                {registerForm.formState.errors.password ? (
                  <div className="mt-[7px] block text-[12px] text-red font-semibold">
                    {registerForm.formState.errors.password.message}
                  </div>
                ) : null}
              </div>

              {formError ? (
                <div className="text-[12px] text-red mt-[7px] font-semibold">{formError}</div>
              ) : (
                <div className="hidden" />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-navy text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer hover:bg-navy-mid active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </section>

      {forgotOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setForgotOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[420px] rounded-[16px] bg-card p-[26px] shadow-modal">
            <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Forgot Password</div>
            <div className="text-[13px] text-muted mb-[18px]">Get OTP on your email and reset password.</div>

            <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Email</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
            />

            {otpSent ? (
              <>
                <label className="mt-[12px] mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">OTP</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
                <label className="mt-[12px] mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
              </>
            ) : null}

            <div className="mt-[16px] flex gap-[8px]">
              <button
                type="button"
                className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer"
                onClick={() => setForgotOpen(false)}
              >
                Cancel
              </button>
              {!otpSent ? (
                <button
                  type="button"
                  className="flex-1 rounded-btn bg-navy text-white py-[10px] text-[13px] font-semibold"
                  onClick={async () => {
                    try {
                      await requestPasswordOtp({ email: forgotEmail });
                      setOtpSent(true);
                      toast.success('OTP sent to email');
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Could not send OTP');
                    }
                  }}
                >
                  Send OTP
                </button>
              ) : (
                <button
                  type="button"
                  className="flex-1 rounded-btn bg-mint text-white py-[10px] text-[13px] font-semibold"
                  onClick={async () => {
                    try {
                      await resetPasswordWithOtp({ email: forgotEmail, otp, newPassword });
                      toast.success('Password reset successful');
                      setForgotOpen(false);
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Reset failed');
                    }
                  }}
                >
                  Reset Password
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

