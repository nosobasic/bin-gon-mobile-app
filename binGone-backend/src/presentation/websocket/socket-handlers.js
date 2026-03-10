import jwt from 'jsonwebtoken';
import Thread from '../../domain/thread.model.js';
import Message from '../../domain/message.model.js';
import mongoose from 'mongoose';

// Store online users and their socket IDs
const onlineUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId

export function initializeSocketHandlers(io, env) {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = jwt.verify(token, env.jwtSecret);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected via socket ${socket.id}`);

    // Track online users
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    userSockets.set(socket.id, userId);

    // Broadcast user online status to their threads
    broadcastUserStatus(socket, userId, 'online');

    // Join user to their personal room for notifications
    socket.join(`user:${userId}`);

    // Handle joining a specific thread
    socket.on('join_thread', async (data) => {
      try {
        const { threadId } = data;

        if (!threadId || !mongoose.isValidObjectId(threadId)) {
          socket.emit('error', { message: 'Invalid thread ID' });
          return;
        }

        // Verify user has access to this thread
        const thread = await Thread.findById(threadId);
        if (!thread) {
          socket.emit('error', { message: 'Thread not found' });
          return;
        }

        if (thread.donorId.toString() !== userId && thread.receiverId.toString() !== userId) {
          socket.emit('error', { message: 'Access denied to this thread' });
          return;
        }

        // Join the thread room
        socket.join(`thread:${threadId}`);
        socket.currentThread = threadId;

        // Notify the thread that user has joined
        socket.to(`thread:${threadId}`).emit('user_joined_thread', {
          userId,
          threadId,
          timestamp: new Date()
        });

        socket.emit('joined_thread', { threadId });
        console.log(`User ${userId} joined thread ${threadId}`);
      } catch (error) {
        console.error('Error joining thread:', error);
        socket.emit('error', { message: 'Failed to join thread' });
      }
    });

    // Handle leaving a thread
    socket.on('leave_thread', (data) => {
      const { threadId } = data;
      if (threadId) {
        socket.leave(`thread:${threadId}`);
        socket.to(`thread:${threadId}`).emit('user_left_thread', {
          userId,
          threadId,
          timestamp: new Date()
        });
        socket.currentThread = null;
        socket.emit('left_thread', { threadId });
        console.log(`User ${userId} left thread ${threadId}`);
      }
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { threadId, content, messageType = 'text', attachmentUrl } = data;

        if (!threadId || !mongoose.isValidObjectId(threadId)) {
          socket.emit('error', { message: 'Invalid thread ID' });
          return;
        }

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        if (content.length > 2000) {
          socket.emit('error', { message: 'Message too long (max 2000 characters)' });
          return;
        }

        // Verify user has access to this thread
        const thread = await Thread.findById(threadId);
        if (!thread) {
          socket.emit('error', { message: 'Thread not found' });
          return;
        }

        if (thread.donorId.toString() !== userId && thread.receiverId.toString() !== userId) {
          socket.emit('error', { message: 'Access denied to this thread' });
          return;
        }

        // Create the message
        const message = await Message.create({
          threadId,
          senderId: userId,
          content: content.trim(),
          messageType,
          attachmentUrl
        });

        // Update thread's last message time and unread count
        const otherUserId = userId === thread.donorId.toString() ? thread.receiverId.toString() : thread.donorId.toString();
        const unreadField = userId === thread.donorId.toString() ? 'receiverUnreadCount' : 'donorUnreadCount';

        await Thread.findByIdAndUpdate(threadId, {
          lastMessageAt: new Date(),
          $inc: { [unreadField]: 1 }
        });

        // Populate sender info
        await message.populate('senderId', 'name profileImageUrl');

        const messageData = {
          id: message._id,
          threadId: message.threadId,
          content: message.content,
          messageType: message.messageType,
          attachmentUrl: message.attachmentUrl,
          sender: message.senderId,
          status: 'sent',
          createdAt: message.createdAt
        };

        // Emit to the thread room
        io.to(`thread:${threadId}`).emit('message_received', messageData);

        // Send push notification to offline users (if they're not in the thread room)
        const otherUserSockets = onlineUsers.get(otherUserId);
        if (!otherUserSockets || otherUserSockets.size === 0) {
          // User is offline - here you could integrate with FCM/APNs for push notifications
          console.log(`User ${otherUserId} is offline - would send push notification`);
        }

        console.log(`Message sent in thread ${threadId} by user ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { threadId } = data;
      if (threadId && socket.currentThread === threadId) {
        socket.to(`thread:${threadId}`).emit('user_typing', {
          userId,
          threadId,
          typing: true,
          timestamp: new Date()
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { threadId } = data;
      if (threadId && socket.currentThread === threadId) {
        socket.to(`thread:${threadId}`).emit('user_typing', {
          userId,
          threadId,
          typing: false,
          timestamp: new Date()
        });
      }
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { threadId } = data;

        if (!threadId || !mongoose.isValidObjectId(threadId)) {
          return;
        }

        // Verify user has access to this thread
        const thread = await Thread.findById(threadId);
        if (!thread || (thread.donorId.toString() !== userId && thread.receiverId.toString() !== userId)) {
          return;
        }

        // Mark messages as read
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

        // Reset unread count
        const updateField = userId === thread.donorId.toString() ? 'donorUnreadCount' : 'receiverUnreadCount';
        await Thread.findByIdAndUpdate(threadId, { [updateField]: 0 });

        // Notify the thread about read receipts
        socket.to(`thread:${threadId}`).emit('messages_read', {
          userId,
          threadId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected from socket ${socket.id}`);

      // Remove from online users tracking
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          // Broadcast user offline status to their threads
          broadcastUserStatus(socket, userId, 'offline');
        }
      }
      userSockets.delete(socket.id);
    });
  });

  // Helper function to broadcast user online/offline status
  async function broadcastUserStatus(socket, userId, status) {
    try {
      // Get all threads this user is part of
      const threads = await Thread.find({
        $or: [{ donorId: userId }, { receiverId: userId }]
      }).select('_id');

      // Broadcast to each thread
      threads.forEach(thread => {
        socket.to(`thread:${thread._id}`).emit('user_status', {
          userId,
          status,
          timestamp: new Date()
        });
      });
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }
}

// Export helper functions for external use
export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
}
