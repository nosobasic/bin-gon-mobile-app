import User from '../domain/user.model.js';

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function sendRegistrationVerification(email) {
  const user = await User.findOne({ email });
  if (!user) return null;
  const otp = generateOtp();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  user.emailVerificationOtp = otp;
  user.emailVerificationOtpExpiresAt = expires;
  await user.save();

  // Reuse password-reset nodemailer config
  const { default: nodemailer } = await import('nodemailer');
  if (process.env.SMTP_FROM && process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      requireTLS: String(process.env.SMTP_REQUIRE_TLS || '').toLowerCase() === 'true',
      tls: { minVersion: 'TLSv1.2' },
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Verify your email for BinGone',
        text: `Your verification code is ${otp}. It expires in 15 minutes.`,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to send verification email:', e.message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`[DEV] Registration OTP for ${email}: ${otp}`);
  }
  return otp;
}

export async function verifyRegistrationOtp(email, otp) {
  const user = await User.findOne({ email });
  if (!user || !user.emailVerificationOtp || !user.emailVerificationOtpExpiresAt) return false;
  if (user.emailVerificationOtp !== otp) return false;
  if (user.emailVerificationOtpExpiresAt.getTime() < Date.now()) return false;
  user.emailVerified = true;
  user.emailVerificationOtp = null;
  user.emailVerificationOtpExpiresAt = null;
  await user.save();
  return true;
}


