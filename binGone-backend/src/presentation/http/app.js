import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { authRouter } from './routes/auth.js';
import { listingsRouter } from './routes/listings.js';
import { categoriesRouter } from './routes/categories.js';
import { storiesRouter } from './routes/stories.js';
import { adminRouter } from './routes/admin.js';        
import { fallbacksRouter } from './routes/fallbacks.js';
import { uploadsRouter } from './routes/uploads.js';
import { chatsRouter } from './routes/chats.js';
import { rewardsRouter } from './routes/rewards.js';
import { paymentsRouter } from './routes/payments.js';
import { wishlistRouter } from './routes/wishlist.js';

export function buildApp(env) {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  // Static uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Static public files (test interface)
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  app.use('/test', express.static(publicDir));

  app.get('/', (req, res) =>
    res.json({
      name: 'BinGone API',
      status: 'ok',
      health: '/health',
      apiBase: '/api',
    })
  );

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter(env));
  app.use('/api/listings', listingsRouter(env));
  app.use('/api/categories', categoriesRouter(env));
  app.use('/api/stories', storiesRouter(env));
  app.use('/api/admin', adminRouter(env));
  app.use('/api/fallbacks', fallbacksRouter());
  app.use('/api/uploads', uploadsRouter(env));
  app.use('/api/chats', chatsRouter(env));
  app.use('/api/rewards', rewardsRouter(env));
  app.use('/api/payments', paymentsRouter(env));
  app.use('/api/wishlist', wishlistRouter(env));

  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  });

  return app;
}


