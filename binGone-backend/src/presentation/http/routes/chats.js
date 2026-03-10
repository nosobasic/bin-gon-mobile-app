import express from 'express';
import Thread from '../../../domain/thread.model.js';
import Message from '../../../domain/message.model.js';
import Listing from '../../../domain/listing.model.js';
import { authMiddleware } from '../middleware/auth.js';
import mongoose from 'mongoose';

export function chatsRouter(env) {
  const router = express.Router();

  // All chat routes require authentication
  router.use(authMiddleware(env));

  // Get user's chat threads
  router.get('/threads', async (req, res, next) => {
    try {
      const userId = req.user.id;
      const threads = await Thread.find({
        $or: [{ donorId: userId }, { receiverId: userId }]
      })
        .populate('listingId', 'title images status')
        .populate('donorId', 'name profileImageUrl')
        .populate('receiverId', 'name profileImageUrl')
        .sort({ lastMessageAt: -1 })
        .limit(50);

      // Get last message for each thread
      const threadsWithLastMessage = await Promise.all(
        threads.map(async (thread) => {
          const lastMessage = await Message.findOne({ threadId: thread._id })
            .sort({ createdAt: -1 })
            .populate('senderId', 'name');
          
          const unreadCount = userId === thread.donorId.toString() 
            ? thread.donorUnreadCount 
            : thread.receiverUnreadCount;

          return {
            id: thread._id,
            listing: thread.listingId,
            donor: thread.donorId,
            receiver: thread.receiverId,
            lastMessageAt: thread.lastMessageAt,
            unreadCount,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              sender: lastMessage.senderId,
              createdAt: lastMessage.createdAt
            } : null,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt
          };
        })
      );

      res.json(threadsWithLastMessage);
    } catch (e) {
      next(e);
    }
  });

  // Create or get thread for a listing
  router.post('/threads', async (req, res, next) => {
    try {
      const { listingId } = req.body;
      const receiverId = req.user.id;

      if (!listingId || !mongoose.isValidObjectId(listingId)) {
        return res.status(400).json({ message: 'Valid listingId is required' });
      }

      // Get the listing to find the donor
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const donorId = listing.ownerId.toString();

      // Don't allow donor to create thread with themselves
      if (donorId === receiverId) {
        return res.status(400).json({ message: 'Cannot create thread with yourself' });
      }

      // Find existing thread or create new one
      let thread = await Thread.findOne({ listingId, receiverId });
      
      if (!thread) {
        thread = await Thread.create({
          listingId,
          donorId,
          receiverId
        });
      }

      // Populate the thread data
      await thread.populate([
        { path: 'listingId', select: 'title images status' },
        { path: 'donorId', select: 'name profileImageUrl' },
        { path: 'receiverId', select: 'name profileImageUrl' }
      ]);

      res.status(201).json({
        id: thread._id,
        listing: thread.listingId,
        donor: thread.donorId,
        receiver: thread.receiverId,
        lastMessageAt: thread.lastMessageAt,
        unreadCount: receiverId === donorId ? thread.donorUnreadCount : thread.receiverUnreadCount,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      });
    } catch (e) {
      next(e);
    }
  });

  // Get messages for a thread
  router.get('/threads/:threadId/messages', async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      const { page = 1, limit = 50 } = req.query;

      if (!mongoose.isValidObjectId(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }

      // Verify user has access to this thread
      const thread = await Thread.findById(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }

      if (thread.donorId.toString() !== userId && thread.receiverId.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const messages = await Message.find({ threadId })
        .populate('senderId', 'name profileImageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Mark messages as read for the current user
      await Message.updateMany(
        { 
          threadId, 
          senderId: { $ne: userId },
          status: { $ne: 'read' }
        },
        { 
          status: 'read',
          readAt: new Date()
        }
      );

      // Reset unread count for current user
      const updateField = userId === thread.donorId.toString() 
        ? 'donorUnreadCount' 
        : 'receiverUnreadCount';
      await Thread.findByIdAndUpdate(threadId, { [updateField]: 0 });

      res.json({
        messages: messages.reverse().map(msg => ({
          id: msg._id,
          content: msg.content,
          messageType: msg.messageType,
          attachmentUrl: msg.attachmentUrl,
          sender: msg.senderId,
          status: msg.status,
          readAt: msg.readAt,
          createdAt: msg.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // Send message via REST (fallback)
  router.post('/threads/:threadId/messages', async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      const { content, messageType = 'text', attachmentUrl } = req.body;

      if (!mongoose.isValidObjectId(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Verify user has access to this thread
      const thread = await Thread.findById(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }

      if (thread.donorId.toString() !== userId && thread.receiverId.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Create message
      const message = await Message.create({
        threadId,
        senderId: userId,
        content: content.trim(),
        messageType,
        attachmentUrl
      });

      // Update thread's last message time and unread count
      const otherUserId = userId === thread.donorId.toString() ? thread.receiverId : thread.donorId;
      const unreadField = userId === thread.donorId.toString() 
        ? 'receiverUnreadCount' 
        : 'donorUnreadCount';

      await Thread.findByIdAndUpdate(threadId, {
        lastMessageAt: new Date(),
        $inc: { [unreadField]: 1 }
      });

      await message.populate('senderId', 'name profileImageUrl');

      res.status(201).json({
        id: message._id,
        content: message.content,
        messageType: message.messageType,
        attachmentUrl: message.attachmentUrl,
        sender: message.senderId,
        status: message.status,
        createdAt: message.createdAt
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
