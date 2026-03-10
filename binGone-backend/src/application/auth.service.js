import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../domain/user.model.js';

export async function registerUser({ name, email, password, location, phoneNumber, profileImageUrl, accountType }, jwtSecret) {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const isFirstUser = (await User.countDocuments()) === 0;
  const user = await User.create({
    name,
    email,
    passwordHash,
    location,
    phoneNumber,
    profileImageUrl,
    accountType,
    role: isFirstUser ? 'admin' : 'user',
  });

  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: '7d' });
  return { user: toFrontendUser(user), token };
}

export async function loginUser({ email, password }, jwtSecret) {
  const user = await User.findOne({ email });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  if (!user.isActive) throw Object.assign(new Error('Account is inactive. Please contact support.'), { status: 403 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: '7d' });
  return { user: toFrontendUser(user), token };
}

export function sanitizeUser(userDoc) {
  const user = userDoc.toObject({ versionKey: false });
  delete user.passwordHash;
  return user;
}

export function toFrontendUser(userDoc) {
  const u = sanitizeUser(userDoc);
  // roleId mapping: 1=donor,2=receiver,3=admin (per frontend example comment)
  const roleId = u.role === 'admin' ? 3 : (u.accountType === 'receiver' ? 2 : 1);
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.accountType || (u.role === 'admin' ? 'admin' : 'donor'),
    roleId,
    phoneNumber: u.phoneNumber || '',
    profileImageUrl: u.profileImageUrl || '',
    emailVerified: u.emailVerified || false,
  };
}




