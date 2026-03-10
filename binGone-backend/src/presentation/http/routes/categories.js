import express from 'express';
import Category from '../../../domain/category.model.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export function categoriesRouter(env) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const items = await Category.find().sort({ name: 1 });
      // Transform _id to id for frontend compatibility
      const transformedItems = items.map(item => ({
        id: item._id,
        name: item.name,
        slug: item.slug,
        icon: item.icon,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      res.json(transformedItems);
    } catch (e) {
      next(e);
    }
  });

  router.post('/', authMiddleware(env), requireAdmin, async (req, res, next) => {
    try {
      const { name, slug, icon } = req.body;
      const created = await Category.create({ name, slug, icon });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.put('/:id', authMiddleware(env), requireAdmin, async (req, res, next) => {
    try {
      const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    } catch (e) {
      return next(e);
    }
  });

  router.delete('/:id', authMiddleware(env), requireAdmin, async (req, res, next) => {
    try {
      const deleted = await Category.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Not found' });
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}


