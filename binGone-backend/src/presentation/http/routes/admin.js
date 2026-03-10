import express from "express";
import mongoose from "mongoose";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import User from "../../../domain/user.model.js";
import Listing from "../../../domain/listing.model.js";
import Story from "../../../domain/story.model.js";
import Category from "../../../domain/category.model.js";
import Message from "../../../domain/message.model.js";
import Thread from "../../../domain/thread.model.js";
import Wishlist from "../../../domain/wishlist.model.js";

export function adminRouter(env) {
  const router = express.Router();

  router.use(authMiddleware(env), requireAdmin);

  router.get("/analytics/overview", async (req, res, next) => {
    try {
      const [
        totalDonationItems,
        totalDonors,
        totalReceivers,
        totalActiveDonors,
      ] = await Promise.all([
        Listing.countDocuments(),
        User.countDocuments({ accountType: "donor" }),
        User.countDocuments({ accountType: "receiver" }),
        User.countDocuments({
          accountType: "donor",
          $or: [
            { emailVerified: true },
            {
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            }, // Active in last 30 days
          ],
        }),
      ]);

      res.json({
        totalDonationItems,
        totalDonors,
        totalReceivers,
        totalActiveDonors,
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/analytics/categories", async (req, res, next) => {
    try {
      const categories = await Category.find();
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const count = await Listing.countDocuments({
            categoryId: category._id,
          });
          return {
            categoryId: category._id.toString(),
            categoryName: category.name,
            count,
          };
        })
      );

      categoryStats.sort((a, b) => b.count - a.count);

      res.json({ categoryStats });
    } catch (e) {
      next(e);
    }
  });

  router.get("/analytics/monthly-claimed", async (req, res, next) => {
    try {
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({
          message: "Year parameter is required",
        });
      }

      const yearNum = parseInt(year);
      if (
        isNaN(yearNum) ||
        yearNum < 2000 ||
        yearNum > new Date().getFullYear() + 1
      ) {
        return res.status(400).json({
          message:
            "Invalid year. Must be a valid year between 2000 and next year",
        });
      }

      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);

      const monthlyData = await Listing.aggregate([
        {
          $match: {
            status: "claimed",
            updatedAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$updatedAt" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const monthlyCounts = new Array(12).fill(0);

      monthlyData.forEach((item) => {
        monthlyCounts[item._id - 1] = item.count;
      });

      res.json({
        year: yearNum,
        monthlyClaimedListings: monthlyCounts,
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/users", async (req, res, next) => {
    try {
      const users = await User.find().sort({ createdAt: -1 }).limit(200);
      res.json(
        users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          accountType: u.accountType,
          points: u.points,
          isPremium: u.isPremium,
          isActive: u.isActive,
          createdAt: u.createdAt,
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  router.put("/users/:id/role", async (req, res, next) => {
    try {
      const updated = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Not found" });
      return res.json({ id: updated._id, role: updated.role });
    } catch (e) {
      return next(e);
    }
  });

  // Toggle user active/inactive status
  router.put("/users/:id/status", async (req, res, next) => {
    try {
      const { isActive } = req.body;
      
      // Validate isActive is a boolean
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ 
          message: "isActive must be a boolean value" 
        });
      }

      // Prevent admin from deactivating themselves
      if (req.params.id === req.user.id && isActive === false) {
        return res.status(400).json({ 
          message: "You cannot deactivate your own account" 
        });
      }

      const updated = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      );
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({ 
        id: updated._id, 
        isActive: updated.isActive,
        message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (e) {
      return next(e);
    }
  });

  // Update user details (name, email, accountType, phoneNumber, address, role, isActive)
  router.put("/users/:id", async (req, res, next) => {
    try {
      const { name, email, accountType, phoneNumber, address, role, isActive } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ 
          message: "Name and email are required" 
        });
      }

      // Validate accountType if provided
      if (accountType && !['donor', 'receiver'].includes(accountType)) {
        return res.status(400).json({ 
          message: "Invalid accountType. Must be 'donor' or 'receiver'" 
        });
      }

      // Validate role if provided
      if (role && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be 'user' or 'admin'" 
        });
      }

      // Validate isActive if provided
      if (isActive !== undefined && typeof isActive !== 'boolean') {
        return res.status(400).json({ 
          message: "isActive must be a boolean value" 
        });
      }

      // Prevent admin from deactivating themselves
      if (isActive === false && req.params.id === req.user.id) {
        return res.status(400).json({ 
          message: "You cannot deactivate your own account" 
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email is already taken by another user" 
        });
      }

      // Prepare update object
      const updateData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      };

      if (accountType) updateData.accountType = accountType;
      if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
      if (role) updateData.role = role;
      if (address) {
        // If address is provided, you might want to geocode it to coordinates
        // For now, we'll store it as a simple string field
        updateData.address = address.trim();
      }
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return updated user data (excluding sensitive fields)
      res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        accountType: updatedUser.accountType,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        message: "User updated successfully"
      });

    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: "Validation error", 
          details: error.message 
        });
      }
      next(error);
    }
  });

  // Delete user permanently with cascading delete
  router.delete("/users/:id", async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
          throw new Error("You cannot delete your own account");
        }

        // Count related data before deletion for response
        const [listingsCount, storiesCount, threadsAsDonorCount, threadsAsReceiverCount, messagesCount] = await Promise.all([
          Listing.countDocuments({ ownerId: userId }).session(session),
          Story.countDocuments({ authorId: userId }).session(session),
          Thread.countDocuments({ donorId: userId }).session(session),
          Thread.countDocuments({ receiverId: userId }).session(session),
          Message.countDocuments({ senderId: userId }).session(session)
        ]);

        // Delete user's listings
        await Listing.deleteMany({ ownerId: userId }).session(session);

        // Delete user's stories
        await Story.deleteMany({ authorId: userId }).session(session);

        // Delete threads where user is donor or receiver
        await Thread.deleteMany({ 
          $or: [{ donorId: userId }, { receiverId: userId }] 
        }).session(session);

        // Delete messages sent by the user
        await Message.deleteMany({ senderId: userId }).session(session);

        // Finally, delete the user
        await User.findByIdAndDelete(userId).session(session);

        // Return detailed response about what was deleted
        res.json({ 
          message: "User and all related data deleted successfully",
          deletedUserId: userId,
          deletedData: {
            listings: listingsCount,
            stories: storiesCount,
            threadsAsDonor: threadsAsDonorCount,
            threadsAsReceiver: threadsAsReceiverCount,
            messages: messagesCount
          }
        });
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "You cannot delete your own account") {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    } finally {
      await session.endSession();
    }
  });

  // Get all wishlists (admin only)
  router.get("/wishlists", async (req, res, next) => {
    try {
      const { page = 1, limit = 50, userId, name, type, priority } = req.query;
      
      // Build query filter
      const filter = {};
      if (userId) filter.userId = userId;
      if (name) filter.name = { $regex: name, $options: 'i' };
      if (type) filter.type = { $regex: type, $options: 'i' };
      if (priority) filter.priority = priority;

      const wishlists = await Wishlist.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('userId', 'name email accountType');

      // Add userName field for easier access
      const wishlistsWithUserName = wishlists.map(item => ({
        ...item.toObject(),
        userName: item.userId?.name || 'Unknown User'
      }));

      const total = await Wishlist.countDocuments(filter);

      res.json({
        items: wishlistsWithUserName,
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


  // Get specific wishlist item (admin only)
  router.get("/wishlists/:id", async (req, res, next) => {
    try {
      const wishlistItem = await Wishlist.findById(req.params.id)
        .populate('userId', 'name email accountType');

      if (!wishlistItem) {
        return res.status(404).json({ message: 'Wishlist item not found' });
      }

      // Add userName field for easier access
      const itemWithUserName = {
        ...wishlistItem.toObject(),
        userName: wishlistItem.userId?.name || 'Unknown User'
      };

      res.json(itemWithUserName);
    } catch (e) {
      next(e);
    }
  });

  // Update wishlist item (admin only)
  router.put("/wishlists/:id", async (req, res, next) => {
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

      const updated = await Wishlist.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate('userId', 'name email accountType');

      if (!updated) {
        return res.status(404).json({ message: 'Wishlist item not found' });
      }

      // Add userName field for easier access
      const itemWithUserName = {
        ...updated.toObject(),
        userName: updated.userId?.name || 'Unknown User'
      };

      res.json({
        message: 'Wishlist item updated successfully',
        item: itemWithUserName
      });
    } catch (e) {
      next(e);
    }
  });

  // Delete wishlist item (admin only)
  router.delete("/wishlists/:id", async (req, res, next) => {
    try {
      const deleted = await Wishlist.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ message: 'Wishlist item not found' });
      }

      res.json({
        message: 'Wishlist item deleted successfully',
        deletedItem: {
          id: deleted._id,
          name: deleted.name,
          userId: deleted.userId
        }
      });
    } catch (e) {
      next(e);
    }
  });
  return router;
}
