import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import User from '../../../domain/user.model.js';
import { toFrontendUser } from '../../../application/auth.service.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only images are allowed'));
  }
  return cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export function uploadsRouter(env) {
  const router = express.Router();

  // Upload profile image and update user's profileImageUrl
  router.post('/profile', authMiddleware(env), upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      const updated = await User.findByIdAndUpdate(
        req.user.id,
        { profileImageUrl: publicUrl },
        { new: true }
      );
      return res.status(201).json({ url: publicUrl, user: toFrontendUser(updated) });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}


