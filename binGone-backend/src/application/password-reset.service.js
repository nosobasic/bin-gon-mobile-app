import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../domain/user.model.js';

function generateOtp() {
  // 4-digit numeric OTP
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return null; // do not reveal if email exists
  const otp = generateOtp();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  user.resetOtp = otp;
  user.resetOtpExpiresAt = expires;
  user.resetOtpVerified = false;
  await user.save();

  // Send email via SMTP if configured, else log for dev
  let emailSent = false;
  let emailError = null;
  if (process.env.SMTP_FROM && process.env.SMTP_HOST) {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      logger: String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true',
      debug: String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true',
      requireTLS: String(process.env.SMTP_REQUIRE_TLS || '').toLowerCase() === 'true',
      tls: {
        minVersion: 'TLSv1.2',
      },
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    try {
      await transporter.verify();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('SMTP verify failed:', e.message);
    }
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Your BinGone password reset code',
        text: `Your OTP code is ${otp}. It expires in 15 minutes.`,
      });
      emailSent = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to send OTP email:', e.message);
      emailError = e.message;
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }
  return { otp, emailSent, emailError };
}

export async function verifyPasswordResetOtp(email, otp) {
  const user = await User.findOne({ email });
  if (!user || !user.resetOtp || !user.resetOtpExpiresAt) return false;
  if (user.resetOtp !== otp) return false;
  if (user.resetOtpExpiresAt.getTime() < Date.now()) return false;
  user.resetOtpVerified = true;
  await user.save();
  return true;
}

export async function resetPassword(email, newPassword) {
  const user = await User.findOne({ email });
  if (!user || !user.resetOtpVerified) return false;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.resetOtp = null;
  user.resetOtpExpiresAt = null;
  user.resetOtpVerified = false;
  await user.save();
  return true;
}


