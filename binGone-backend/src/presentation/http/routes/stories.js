import express from 'express';
import Story from '../../../domain/story.model.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export function storiesRouter(env) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const { published } = req.query;
      const filter = {};
      if (published != null) filter.published = published === 'true';
      const items = await Story.find(filter).sort({ createdAt: -1 });
      res.json(items);
    } catch (e) {
      next(e);
    }
  });

  router.post('/', authMiddleware(env), async (req, res, next) => {
    try {
      const { title, body, images } = req.body;
      const created = await Story.create({ title, body, images, authorId: req.user.id });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.put('/:id', authMiddleware(env), async (req, res, next) => {
    try {
      const updated = await Story.findOneAndUpdate(
        { _id: req.params.id, authorId: req.user.id },
        req.body,
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    } catch (e) {
      return next(e);
    }
  });

  router.put('/:id/publish', authMiddleware(env), requireAdmin, async (req, res, next) => {
    try {
      const updated = await Story.findByIdAndUpdate(
        req.params.id,
        { published: true },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    } catch (e) {
      return next(e);
    }
  });

  router.delete('/:id', authMiddleware(env), async (req, res, next) => {
    try {
      const deleted = await Story.findOneAndDelete({ _id: req.params.id, authorId: req.user.id });
      if (!deleted) return res.status(404).json({ message: 'Not found' });
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}


