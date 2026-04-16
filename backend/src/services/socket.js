import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as userRepo from '../repositories/user.repository.js';
import * as chatRepo from '../repositories/chat.repository.js';

let io;
const disconnectTimeouts = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication error: No token provided'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error(`Authentication error: Invalid token, ${err.message}`));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;

    // Handle reconnection (clear offline timeout if any)
    if (disconnectTimeouts.has(userId)) {
      clearTimeout(disconnectTimeouts.get(userId));
      disconnectTimeouts.delete(userId);
    } else {
      // Update status to Online
      await userRepo.updateOnlineStatus(userId, true);
      io.emit('user_status_change', { userId, isOnline: true });
    }

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('typing', ({ roomId, isTyping, userName }) => {
      socket.to(roomId).emit('user_typing', { userId: socket.user.id, isTyping, roomId, userName });
    });

    socket.on('message_delivered', async ({ messageId, roomId }) => {
      try {
        const updatedMessage = await chatRepo.markMessageAsDelivered(messageId, userId);
        if (updatedMessage) {
          io.to(roomId).emit('message_status_update', {
            messageId,
            roomId,
            deliveredTo: updatedMessage.deliveredTo,
            readBy: updatedMessage.readBy,
          });
        }
      } catch (err) {
        console.error('Delivery tracking error:', err);
      }
    });

    socket.on('message_delivered_bulk', async ({ messageIds, roomId }) => {
      try {
        for (const messageId of messageIds) {
          const updatedMessage = await chatRepo.markMessageAsDelivered(messageId, userId);
          if (updatedMessage) {
            io.to(roomId).emit('message_status_update', {
              messageId,
              roomId,
              deliveredTo: updatedMessage.deliveredTo,
              readBy: updatedMessage.readBy,
            });
          }
        }
      } catch (err) {
        console.error('Bulk delivery tracking error:', err);
      }
    });

    socket.on('mark_read', async ({ roomId }) => {
      try {
        await chatRepo.markMessagesAsRead(roomId, userId);
        io.to(roomId).emit('messages_marked_read', { roomId, userId });
      } catch (err) {
        console.error('Read tracking error:', err);
      }
    });

    socket.on('disconnect', async () => {
      // Grace period for page refreshes
      const timeout = setTimeout(async () => {
        await userRepo.updateOnlineStatus(userId, false);
        io.emit('user_status_change', { userId, isOnline: false, lastSeen: new Date() });
        disconnectTimeouts.delete(userId);
      }, 5000);

      disconnectTimeouts.set(userId, timeout);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
