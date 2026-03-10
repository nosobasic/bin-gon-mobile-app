import express from 'express';
import Listing from '../../../domain/listing.model.js';
import User from '../../../domain/user.model.js';
import { authMiddleware } from '../middleware/auth.js';

export function listingsRouter(env) {
  const router = express.Router();

  // Create listing
  router.post('/', authMiddleware(env), async (req, res, next) => {
    try {
      const { title, description, images, categoryId, location, address } = req.body;
      const listing = await Listing.create({
        title,
        description,
        images,
        categoryId,
        location,
        address,
        ownerId: req.user.id,
      });
      res.status(201).json(listing);
    } catch (e) {
      next(e);
    }
  });

  // List nearby listings with filters
  router.get('/', async (req, res, next) => {
    try {
      const { lng, lat, radius = 10000, q, categoryId, status, ownerId, groupBy, isPremium } = req.query;
      const filter = {};
      if (q) filter.$text = { $search: q };
      if (categoryId) filter.categoryId = categoryId;
      if (status) filter.status = status;
      if (ownerId) filter.ownerId = ownerId;

  
      if (isPremium === 'true') {
        const premiumUsers = await User.find({ isPremium: true }).select('_id');
        const premiumUserIds = premiumUsers.map(user => user._id);
        filter.ownerId = { $in: premiumUserIds };
      }

      if (lng && lat) {
        filter.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius, 10),
          },
        };
      }

      const items = await Listing.find(filter).limit(100).sort({ createdAt: -1 });

      const uniqueOwnerIds = [...new Set(items.map(item => item.ownerId.toString()))];
      const users = await User.find({ _id: { $in: uniqueOwnerIds } }).select('_id name');
      
      const userMap = users.reduce((map, user) => {
        map[user._id.toString()] = user;
        return map;
      }, {});

      // If groupBy=users, return grouped data
      if (groupBy === 'users') {
        const groupedData = items.reduce((acc, item) => {
          const ownerId = item.ownerId.toString();
          const existingUser = acc.find(group => group.ownerId === ownerId);
          const owner = userMap[ownerId];
          
          if (existingUser) {
            existingUser.listings.push({
              id: item._id,
              title: item.title,
              description: item.description,
              images: item.images,
              categoryId: item.categoryId,
              ownerId: item.ownerId,
              donorName: owner?.name || null,
              location: item.location,
              address: item.address,
              status: item.status,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
            existingUser.count += 1;
          } else {
            acc.push({
              ownerId: ownerId, // Store ownerId for comparison
              user: null, // Will be populated below
              listings: [{
                id: item._id,
                title: item.title,
                description: item.description,
                images: item.images,
                categoryId: item.categoryId,
                ownerId: item.ownerId,
                donorName: owner?.name || null,
                location: item.location,
                address: item.address,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }],
              count: 1
            });
          }
          return acc;
        }, []);
        
        // Fetch full user data for grouped results
        const fullUsers = await User.find({ _id: { $in: uniqueOwnerIds } }).select('-passwordHash');
        const fullUserMap = fullUsers.reduce((map, user) => {
          map[user._id.toString()] = user;
          return map;
        }, {});
        
        // Populate user data in grouped results
        groupedData.forEach(group => {
          group.user = fullUserMap[group.ownerId] || null;
          // Remove the temporary ownerId field from the response
          delete group.ownerId;
        });
        
        return res.json(groupedData);
      }

      // Default behavior - return individual listings
      const transformedItems = items.map(item => {
        const owner = userMap[item.ownerId.toString()];
        return {
          id: item._id,
          title: item.title,
          description: item.description,
          images: item.images,
          categoryId: item.categoryId,
          ownerId: item.ownerId,
          donorName: owner?.name || null,
          location: item.location,
          address: item.address,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });
      res.json(transformedItems);
    } catch (e) {
      next(e);
    }
  });

  // Get single listing
  router.get('/:id', async (req, res, next) => {
    try {
      const item = await Listing.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      
      // Fetch owner information to get donor name
      const owner = await User.findById(item.ownerId).select('name');
      const listingData = item.toObject();
      listingData.donorName = owner?.name || null;
      
      return res.json(listingData);
    } catch (e) {
      return next(e);
    }
  });

  // Update (owner only)
  router.put('/:id', authMiddleware(env), async (req, res, next) => {
    try {
      const query =
        req.user.role === 'admin'
          ? { _id: req.params.id }
          : { _id: req.params.id, ownerId: req.user.id };

      const item = await Listing.findOneAndUpdate(query, req.body, {
        new: true,
      });
      if (!item) return res.status(404).json({ message: "Not found" });
      return res.json(item);
    } catch (e) {
      return next(e);
    }
  });

  // Delete (owner or admin)
  router.delete('/:id', authMiddleware(env), async (req, res, next) => {
    try {
      // Build query: admins can delete any listing, users can only delete their own
      const query = req.user.role === 'admin' 
        ? { _id: req.params.id }
        : { _id: req.params.id, ownerId: req.user.id };
              
      const result = await Listing.findOneAndDelete(query);
      if (!result) return res.status(404).json({ message: 'Not found' });
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}


