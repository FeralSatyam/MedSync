import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (to, otp, name) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'Med Sync <medsync.np@gmail.com>',
    to,
    subject: 'Password Reset Request - MedSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f9;">
        <div style="background-color: #14B8A6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">MedSync</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1a202c; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4a5568; font-size: 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #4a5568; font-size: 16px;">We received a request to reset your password. Use the OTP below to complete the process:</p>
          <div style="background-color: #e6f7f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #14B8A6; letter-spacing: 5px; margin: 0;">${otp}</p>
          </div>
          <p style="color: #4a5568; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #4a5568; font-size: 14px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">MedSync - Your Health Companion</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (to, otp, name) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'Med Sync <medsync.np@gmail.com>',
    to,
    subject: 'Verify Your Email - MedSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f9;">
        <div style="background-color: #14B8A6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">MedSync</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1a202c; margin-top: 0;">Email Verification</h2>
          <p style="color: #4a5568; font-size: 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #4a5568; font-size: 16px;">Thank you for signing up! Use the OTP below to verify your email:</p>
          <div style="background-color: #e6f7f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #14B8A6; letter-spacing: 5px; margin: 0;">${otp}</p>
          </div>
          <p style="color: #4a5568; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">MedSync - Your Health Companion</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};