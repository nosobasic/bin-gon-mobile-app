import express from 'express';
import { registerUser, loginUser, toFrontendUser } from '../../../application/auth.service.js';
import { requestPasswordReset, verifyPasswordResetOtp, resetPassword } from '../../../application/password-reset.service.js';
import { sendRegistrationVerification, verifyRegistrationOtp } from '../../../application/email-verification.service.js';

export function authRouter(env) {
  const router = express.Router();

  router.post('/register', async (req, res, next) => {
    try {
      const { name, email, password, location, phoneNumber, profileImageUrl, accountType } = req.body;
      const result = await registerUser({ name, email, password, location, phoneNumber, profileImageUrl, accountType }, env.jwtSecret);
      // Send verification OTP (non-blocking for response time)
      sendRegistrationVerification(email).catch(() => {});
      res.status(201).json({ token: result.token, user: result.user });
    } catch (e) {
      next(e);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await loginUser({ email, password }, env.jwtSecret);
      if (!result.user.emailVerified) {
        sendRegistrationVerification(email).catch(() => {});
      }
      
      res.json({ token: result.token, user: result.user });
    } catch (e) {
      next(e);
    }
  });

  // Forgot password -> request OTP
  router.post('/forgot-password', async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });
      const result = await requestPasswordReset(email);
      const payload = { status: 'success' };
      if (process.env.NODE_ENV !== 'production' && result?.otp) payload.devOtp = result.otp;
      if (result && 'emailSent' in result) payload.emailSent = result.emailSent;
      if (result && result.emailError) payload.emailError = result.emailError;
      return res.json(payload);
    } catch (e) {
      return next(e);
    }
  });

  // Verify OTP
  router.post('/verify-otp', async (req, res, next) => {
    try {
      const { email, optcode } = req.body; // following requested field name
      if (!email || !optcode) return res.status(400).json({ message: 'Email and optcode are required' });
      const ok = await verifyPasswordResetOtp(email, optcode);
      return res.json({ status: ok ? 'success' : 'failed' });
    } catch (e) {
      return next(e);
    }
  });

  // Reset password
  router.post('/reset-password', async (req, res, next) => {
    try {
      const { email, newPassword, conformPasswrod } = req.body; // keeping requested key
      if (!email || !newPassword || !conformPasswrod) return res.status(400).json({ message: 'Missing fields' });
      if (newPassword !== conformPasswrod) return res.status(400).json({ message: 'Passwords do not match' });
      const ok = await resetPassword(email, newPassword);
      return res.json({ status: ok ? 'success' : 'failed' });
    } catch (e) {
      return next(e);
    }
  });

  // Verify registration email OTP
  router.post('/verify-email', async (req, res, next) => {
    try {
      const { email, optcode } = req.body;
      if (!email || !optcode) return res.status(400).json({ message: 'Email and optcode are required' });
      const ok = await verifyRegistrationOtp(email, optcode);
      return res.json({ status: ok ? 'success' : 'failed' });
    } catch (e) {
      return next(e);
    }
  });

  // Get current profile
  router.get('/me', async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: 'Missing token' });
      const jwt = (await import('jsonwebtoken')).default;
      const payload = jwt.verify(token, env.jwtSecret);
      const { default: User } = await import('../../../domain/user.model.js');
      const user = await User.findById(payload.sub);
      if (!user) return res.status(404).json({ message: 'Not found' });
      return res.json({ user: toFrontendUser(user) });
    } catch (e) {
      return next(e);
    }
  });

  // Update current profile (name, location)
  router.put('/me', async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: 'Missing token' });
      const jwt = (await import('jsonwebtoken')).default;
      const payload = jwt.verify(token, env.jwtSecret);
      const { default: User } = await import('../../../domain/user.model.js');
      const updated = await User.findByIdAndUpdate(payload.sub, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json({ user: toFrontendUser(updated) });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}


