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
    html: `<p>Your MedSync OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}

