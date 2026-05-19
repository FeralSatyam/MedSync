import { useMemo, useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { login, register, requestPasswordOtp, resetPasswordWithOtp, sendVerifyOtp, verifyEmail } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import logo from '../assets/logo.png';

const isValidEmailStr = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@gmail\.com$/i;
  return emailRegex.test(email.trim());
};

const loginSchema = z.object({
  email: z.string().email('Invalid email').trim().refine(isValidEmailStr, { message: 'Invalid or unsupported email provider' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').trim().refine(isValidEmailStr, { message: 'Invalid or unsupported email provider' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerPharmacySchema = z.object({
  pharmacyName: z.string().trim().min(1, 'Pharmacy name is required'),
  ownerName: z.string().trim().min(1, 'Owner name is required'),
  email: z.string().email('Invalid email').trim().refine(isValidEmailStr, { message: 'Invalid or unsupported email provider' }),
  phone: z.string().trim().min(7, 'Valid phone number is required'),
  address: z.string().trim().min(1, 'Address is required'),
  licenseNumber: z.string().trim().min(1, 'License number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  legallyRegistered: z.boolean().refine(val => val === true, {
    message: "You must confirm the pharmacy is legally registered"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [userType, setUserType] = useState('patient'); // 'patient' | 'pharmacist'
  const [pharmacyLicenseId, setPharmacyLicenseId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isPharmacist = userType === 'pharmacist';

  // Animated role switch
  function handleUserTypeSwitch(type) {
    if (type === userType) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setUserType(type);
      setFormError('');
      setPharmacyLicenseId('');
      setTimeout(() => setIsTransitioning(false), 50);
    }, 180);
  }

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

  const registerPharmacyForm = useForm({
    resolver: zodResolver(registerPharmacySchema),
    defaultValues: {
      pharmacyName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      licenseNumber: '',
      password: '',
      confirmPassword: '',
      legallyRegistered: false
    },
  });

  const demoHint = useMemo(() => 'Support: contact@medsync.np', []);

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
        const emailToVerify = res.email || values.email;
        if (!isValidEmailStr(emailToVerify)) {
          toast.error("Invalid email format. Cannot send OTP.");
          setMode('login');
          return;
        }

        setPendingEmail(emailToVerify);
        try {
          await sendVerifyOtp(emailToVerify);
          toast('Please verify your email first. A code has been sent.', { icon: '📧' });
          setVerifyStep(true);
        } catch (verifyErr) {
          toast.error(verifyErr?.response?.data?.message || "Error sending OTP. Email might be incorrect.");
          setVerifyStep(false);
          setMode('register');
        }
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

  // ── Register Pharmacy ──────────────────────────────────────────────────────
  async function onSubmitRegisterPharmacy(values) {
    setFormError('');
    setSubmitting(true);
    try {
      const name = `${values.ownerName} - ${values.pharmacyName}`.trim();
      const data = await register({ name, email: values.email, password: values.password });
      setPendingEmail(data.email || values.email);
      setVerifyStep(true);
      toast.success('Pharmacy account created! Check your email for the verification code.');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Pharmacy registration failed';
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
          <div className="flex items-center justify-center bg-white px-[20px] py-[14px] rounded-[18px] shadow-lg w-fit">
            <img src={logo} alt="MedSync Logo" className="h-[48px] w-auto object-contain" />
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
          <div className="md:hidden mb-[22px] flex items-center">
            <img src={logo} alt="MedSync Logo" className="h-[42px] w-auto object-contain" />
          </div>

          {/* ── Role Toggle: Patient / Pharmacist ── */}
          <div className="flex items-center gap-[6px] mb-[22px]">
            <button
              type="button"
              onClick={() => handleUserTypeSwitch('patient')}
              className={`relative flex items-center gap-[6px] px-[14px] py-[7px] rounded-full text-[12px] font-semibold cursor-pointer border transition-all duration-300 ${
                !isPharmacist
                  ? 'bg-navy text-white border-navy shadow-sm'
                  : 'bg-transparent text-muted border-border hover:text-navy hover:border-navy/30'
              }`}
            >
              {/* Patient icon */}
              <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeSwitch('pharmacist')}
              className={`relative flex items-center gap-[6px] px-[14px] py-[7px] rounded-full text-[12px] font-semibold cursor-pointer border transition-all duration-300 ${
                isPharmacist
                  ? 'bg-mint text-white border-mint shadow-sm'
                  : 'bg-transparent text-muted border-border hover:text-mint hover:border-mint/30'
              }`}
            >
              {/* Pharmacy Rx icon */}
              <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Pharmacist
              {isPharmacist && (
                <span className="ml-[2px] px-[6px] py-[1px] rounded-full bg-white/20 text-[9px] font-bold tracking-wide uppercase">
                  Rx
                </span>
              )}
            </button>
          </div>

          {/* ── Pharmacist badge ── */}
          <div className={`overflow-hidden transition-all duration-300 ease-out ${
            isPharmacist ? 'max-h-[48px] opacity-100 mb-[16px]' : 'max-h-0 opacity-0 mb-0'
          }`}>
            <div className="flex items-center gap-[8px] px-[14px] py-[9px] rounded-[12px] bg-mint/5 border border-mint/15">
              <svg className="w-[16px] h-[16px] text-mint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[11px] font-semibold text-mint">For Licensed Pharmacies</span>
              <span className="text-[10px] text-muted ml-auto">Verified access only</span>
            </div>
          </div>

          {/* ── Header & subtitle with transition ── */}
          <div className={`transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 translate-y-[4px]' : 'opacity-100 translate-y-0'}`}>
            <h2 className="font-display text-[28px] font-bold tracking-[-0.4px] text-navy mb-[6px]">
              {isPharmacist
                ? (mode === 'login' ? 'Pharmacist Portal' : 'Register Your Pharmacy')
                : (mode === 'login' ? 'Sign In' : 'Register')}
            </h2>
            <p className="text-[14px] font-body text-muted mb-[32px]">
              {isPharmacist
                ? (mode === 'login' ? 'Secure pharmacy access for medicine verification and dispensing.' : 'Create a verified pharmacy account to access MedSync dispensing tools.')
                : (mode === 'login' ? 'Welcome back! Enter your details.' : 'Create an account to start tracking medicines.')}
            </p>
          </div>

          {/* Tab switcher - show for both, change labels based on role */}
          <div className="flex gap-[4px] bg-bg rounded-[14px] p-[5px] mb-[26px]">
            <button type="button" onClick={() => setMode('login')}
              className={`flex-1 px-[8px] py-[10px] rounded-[10px] font-body text-[13px] font-semibold cursor-pointer transition-all ${mode === 'login' ? 'bg-card text-navy shadow-sm' : 'bg-transparent text-muted hover:text-navy'
                }`}>
              {isPharmacist ? 'Login' : 'Sign In'}
            </button>
            <button type="button" onClick={() => setMode('register')}
              className={`flex-1 px-[8px] py-[10px] rounded-[10px] font-body text-[13px] font-semibold cursor-pointer transition-all ${mode === 'register' ? 'bg-card text-navy shadow-sm' : 'bg-transparent text-muted hover:text-navy'
                }`}>
              {isPharmacist ? 'Register Pharmacy' : 'Register'}
            </button>
          </div>

          {/* ── LOGIN / REGISTER FORMS ── */}
          <div className={`transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 translate-y-[6px]' : 'opacity-100 translate-y-0'}`}>
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

              {/* ── Pharmacy License ID (pharmacist only) ── */}
              <div className={`overflow-hidden transition-all duration-300 ease-out ${
                isPharmacist ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div>
                  <label className="mb-[7px] flex items-center gap-[6px] text-[12px] font-semibold tracking-[0.02em] text-navy">
                    <svg className="w-[13px] h-[13px] text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    Pharmacy License ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PH-2024-XXXXX"
                    value={pharmacyLicenseId}
                    onChange={(e) => setPharmacyLicenseId(e.target.value)}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                  />
                </div>
              </div>

              {formError && <div className="text-[12px] text-red font-semibold">{formError}</div>}

              <button type="submit" disabled={submitting}
                className={`w-full text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 ${
                  isPharmacist
                    ? 'bg-mint hover:bg-mint-mid'
                    : 'bg-navy hover:bg-navy-mid'
                }`}>
                {submitting
                  ? (isPharmacist ? 'Authenticating...' : 'Signing in...')
                  : (isPharmacist ? 'Login as Pharmacist' : 'Sign In')}
              </button>

              {/* ── Pharmacist trust/security note ── */}
              <div className={`overflow-hidden transition-all duration-300 ease-out ${
                isPharmacist ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="flex items-center justify-center gap-[6px] text-[11px] text-muted py-[2px]">
                  <svg className="w-[12px] h-[12px] text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Verified pharmacies only &middot; Secure encrypted access</span>
                </div>
              </div>

              {!isPharmacist && (
                <>
                  <button type="button" className="w-full text-[12px] text-mint-mid underline"
                    onClick={() => { setForgotOpen(true); setOtpSent(false); setForgotEmail(loginForm.getValues('email') || ''); setResetOtp(''); setNewPassword(''); }}>
                    Forgot password?
                  </button>
                  <div className="mt-[10px] text-[12px] text-muted text-center bg-[#f0f2f8] py-[10px] px-[14px] rounded-[10px]">
                    {demoHint}
                  </div>
                </>
              )}
            </form>

          ) : isPharmacist ? (
            /* ── REGISTER PHARMACY FORM ── */
            <form onSubmit={registerPharmacyForm.handleSubmit(onSubmitRegisterPharmacy)} className="space-y-[18px]">
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Pharmacy Name</label>
                  <input type="text" {...registerPharmacyForm.register('pharmacyName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerPharmacyForm.formState.errors.pharmacyName && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.pharmacyName.message}</div>}
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Owner / Pharmacist Name</label>
                  <input type="text" {...registerPharmacyForm.register('ownerName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerPharmacyForm.formState.errors.ownerName && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.ownerName.message}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Pharmacy Email</label>
                  <input type="email" {...registerPharmacyForm.register('email')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerPharmacyForm.formState.errors.email && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.email.message}</div>}
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Phone Number</label>
                  <input type="text" {...registerPharmacyForm.register('phone')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerPharmacyForm.formState.errors.phone && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.phone.message}</div>}
                </div>
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Pharmacy Address</label>
                <input type="text" {...registerPharmacyForm.register('address')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                {registerPharmacyForm.formState.errors.address && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.address.message}</div>}
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Pharmacy License Number</label>
                <input type="text" {...registerPharmacyForm.register('licenseNumber')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                {registerPharmacyForm.formState.errors.licenseNumber && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.licenseNumber.message}</div>}
              </div>

              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Password</label>
                  <input type="password" {...registerPharmacyForm.register('password')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerPharmacyForm.formState.errors.password && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.password.message}</div>}
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Confirm Password</label>
                  <input type="password" {...registerPharmacyForm.register('confirmPassword')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint" />
                  {registerPharmacyForm.formState.errors.confirmPassword && <div className="mt-[7px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.confirmPassword.message}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Upload Pharmacy License <span className="text-muted font-normal">(Optional)</span></label>
                  <input type="file" accept="image/*,.pdf"
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[8px] text-[13px] text-navy outline-none transition-colors focus:border-mint file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-mint/10 file:text-mint hover:file:bg-mint/20" />
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Upload Pharmacy Logo <span className="text-muted font-normal">(Optional)</span></label>
                  <input type="file" accept="image/*"
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[8px] text-[13px] text-navy outline-none transition-colors focus:border-mint file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-mint/10 file:text-mint hover:file:bg-mint/20" />
                </div>
              </div>

              <div className="flex items-start gap-[10px] mt-[8px]">
                <input type="checkbox" id="legallyRegistered" {...registerPharmacyForm.register('legallyRegistered')}
                  className="mt-[2px] w-[16px] h-[16px] rounded-[4px] border-border text-mint focus:ring-mint cursor-pointer accent-mint" />
                <label htmlFor="legallyRegistered" className="text-[13px] text-navy font-medium leading-tight cursor-pointer">
                  I confirm this pharmacy is legally registered.
                </label>
              </div>
              {registerPharmacyForm.formState.errors.legallyRegistered && <div className="mt-[4px] text-[12px] text-red font-semibold">{registerPharmacyForm.formState.errors.legallyRegistered.message}</div>}

              {formError && <div className="text-[12px] text-red font-semibold">{formError}</div>}
              
              <button type="submit" disabled={submitting}
                className="w-full bg-mint text-white rounded-btn border-none py-[12px] text-[14px] font-medium cursor-pointer hover:bg-mint-mid active:scale-[0.98] transition-all disabled:opacity-60">
                {submitting ? 'Registering...' : 'Register Pharmacy'}
              </button>
              
              <div className="text-center mt-[16px]">
                <button type="button" onClick={() => setMode('login')} className="text-[13px] text-muted hover:text-navy transition-colors">
                  Already registered? <span className="font-semibold text-mint">Login</span>
                </button>
              </div>
            </form>
          ) : (
            /* ── REGISTER PATIENT FORM ── */
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
                    if (!isValidEmailStr(forgotEmail)) {
                      toast.error('Invalid email format. Please check and try again.');
                      setForgotOpen(false);
                      setMode('login');
                      return;
                    }
                    try {
                      await requestPasswordOtp({ email: forgotEmail });
                      setOtpSent(true);
                      toast.success('OTP sent to email');
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Could not send OTP');
                      setForgotOpen(false);
                      setMode('register');
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