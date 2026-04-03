import nodemailer from 'nodemailer';

let cachedTransporter = null;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function isMailerConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Existing — used for password reset
export async function sendOtpEmail({ to, otp }) {
  if (!cachedTransporter) cachedTransporter = createTransporter();
  if (!cachedTransporter) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await cachedTransporter.sendMail({
    from,
    to,
    subject: 'MedSync password reset OTP',
    text: `Your MedSync OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1d4ed8">Password Reset</h2>
        <p>Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;padding:16px 0">${otp}</div>
        <p style="color:#6b7280;font-size:13px">If you did not request this, ignore this email.</p>
      </div>`,
  });
}

// NEW — used for email verification after registration
export async function sendVerifyOtpEmail({ to, otp }) {
  if (!cachedTransporter) cachedTransporter = createTransporter();
  if (!cachedTransporter) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await cachedTransporter.sendMail({
    from,
    to,
    subject: 'MedSync — verify your email',
    text: `Your MedSync verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0f766e">Verify your email</h2>
        <p>Thanks for registering! Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0f766e;padding:16px 0">${otp}</div>
        <p style="color:#6b7280;font-size:13px">If you did not create a MedSync account, ignore this email.</p>
      </div>`,
  });
}