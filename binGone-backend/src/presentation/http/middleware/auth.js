import jwt from 'jsonwebtoken';
import User from '../../../domain/user.model.js';

export function authMiddleware(env) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }
      req.user = { id: payload.sub, role: payload.role };
      return next();
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  return next();
} 