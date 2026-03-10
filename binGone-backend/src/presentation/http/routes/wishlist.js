import express from 'express';
import Wishlist from '../../../domain/wishlist.model.js';
import { authMiddleware } from '../middleware/auth.js';

export function wishlistRouter(env) {
  const router = express.Router();

  // Get user's wishlist
  router.get('/', authMiddleware(env), async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const wishlistItems = await Wishlist.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Wishlist.countDocuments({ userId: req.user.id });

      res.json({
        items: wishlistItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // Add item to wishlist
  router.post('/', authMiddleware(env), async (req, res, next) => {
    try {
      const { name, type, size, location, notes, priority } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: 'Item name is required' });
      }

      // Create wishlist item
      const wishlistItem = await Wishlist.create({
        userId: req.user.id,
        name: name.trim(),
        type: type?.trim() || '',
        size: size?.trim() || '',
        location: location?.trim() || '',
        notes: notes?.trim() || '',
        priority: priority || 'medium'
      });

      res.status(201).json({
        message: 'Added to wishlist',
        item: wishlistItem
      });
    } catch (e) {
      next(e);
    }
  });

  // Remove from wishlist by wishlist item ID
  router.delete('/:wishlistId', authMiddleware(env), async (req, res, next) => {
    try {
      const result = await Wishlist.findOneAndDelete({
        userId: req.user.id,
        _id: req.params.wishlistId
      });

      if (!result) {
        return res.status(404).json({ message: 'Item not in wishlist' });
      }

      res.json({ 
        message: 'Removed from wishlist',
        wishlistId: req.params.wishlistId 
      });
    } catch (e) {
      next(e);
    }
  });

  // Update wishlist item
  router.put('/:wishlistId', authMiddleware(env), async (req, res, next) => {
    try {
      const { name, type, size, location, notes, priority, notifyOnAvailable } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (type !== undefined) updateData.type = type?.trim() || '';
      if (size !== undefined) updateData.size = size?.trim() || '';
      if (location !== undefined) updateData.location = location?.trim() || '';
      if (notes !== undefined) updateData.notes = notes?.trim() || '';
      if (priority !== undefined) updateData.priority = priority;
      if (notifyOnAvailable !== undefined) updateData.notifyOnAvailable = notifyOnAvailable;

      const updated = await Wishlist.findOneAndUpdate(
        { userId: req.user.id, _id: req.params.wishlistId },
        updateData,
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: 'Item not in wishlist' });
      }

      res.json({
        message: 'Wishlist item updated',
        item: updated
      });
    } catch (e) {
      next(e);
    }
  });

  // Clear entire wishlist
  router.delete('/', authMiddleware(env), async (req, res, next) => {
    try {
      const result = await Wishlist.deleteMany({ userId: req.user.id });

      res.json({
        message: 'Wishlist cleared',
        deletedCount: result.deletedCount
      });
    } catch (e) {
      next(e);
    }
  });

  // Get wishlist count (quick stats)
  router.get('/count', authMiddleware(env), async (req, res, next) => {
    try {
      const count = await Wishlist.countDocuments({ userId: req.user.id });

      res.json({
        count
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

