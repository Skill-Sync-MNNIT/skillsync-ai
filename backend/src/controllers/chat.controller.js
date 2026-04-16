import * as chatRepo from '../repositories/chat.repository.js';
import * as connectionRepo from '../repositories/connection.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { getIO } from '../services/socket.js';
import cloudinary from '../config/cloudinary.js';
import { NotificationEngine } from '../services/notifications/notification.engine.js';

export const start1on1Chat = async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const { recipientId } = req.body;

    // 1. Check if they are connected
    const connection = await connectionRepo.findConnection(requesterId, recipientId);
    if (!connection || connection.status !== 'accepted') {
      return res
        .status(403)
        .json({ message: 'You can only chat with users you are connected to.' });
    }

    // 2. Check if room exists
    let room = await chatRepo.find1on1Room(requesterId, recipientId);
    if (!room) {
      room = await chatRepo.createRoom([requesterId, recipientId], false);
    }

    res.json(room);
  } catch (err) {
    next(err);
  }
};

export const createGroupChat = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { participantIds, name } = req.body;

    // Logic: Participants must be connections of the admin (usually)
    // For simplicity, we'll just create it with provided IDs for now
    // But ideally, we should verify each participant is a connection.

    const participants = [...new Set([...participantIds, adminId])];
    const room = await chatRepo.createRoom(participants, true, name, [adminId]);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { roomId, content, replyTo } = req.body;

    const room = await chatRepo.findRoomById(roomId);
    if (!room || !room.participants.some((p) => p._id.toString() === senderId)) {
      return res.status(403).json({ message: 'Unauthorized or room not found.' });
    }

    const message = await chatRepo.createMessage(roomId, senderId, content, replyTo);

    // Emit real-time event
    const io = getIO();
    io.to(roomId).emit('new_message', message);

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

export const getConversationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    const room = await chatRepo.findRoomById(roomId);
    if (!room || !room.participants.some((p) => p._id.toString() === userId)) {
      return res.status(403).json({ message: 'Unauthorized or room not found.' });
    }

    const messages = await chatRepo.getRoomMessages(roomId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const getMyChatRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rooms = await chatRepo.getUserRooms(userId);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    const room = await chatRepo.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    // 1. Authorization: Only admins can delete group chats.
    // Participant check for 1-on-1 (though usually we don't 'delete' 1-on-1 rooms, we keep it for simplicity)
    if (room.isGroup) {
      const isAdmin = room.admins.some((a) => (a._id || a).toString() === userId);
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only group admins can discard the group.' });
      }
    } else {
      if (!room.participants.some((p) => p._id.toString() === userId)) {
        return res.status(403).json({ message: 'Unauthorized.' });
      }
    }

    // 2. Trigger persistent notifications for members before wiping data
    if (room.isGroup) {
      await NotificationEngine.triggerForGroupDiscard(room);
    }

    await chatRepo.deleteChatRoom(roomId);

    // Notify all participants about the deletion
    getIO().to(roomId).emit('room_discarded', { roomId, adminId: userId });

    res.json({ message: 'Chat discarded and removed for all members successfully.' });
  } catch (err) {
    next(err);
  }
};

export const clearChatMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    const room = await chatRepo.findRoomById(roomId);
    if (!room || !room.participants.some((p) => p._id.toString() === userId)) {
      return res.status(403).json({ message: 'Unauthorized or room not found.' });
    }

    const updatedRoom = await chatRepo.clearChatMessages(roomId);
    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const manageGroupMember = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { roomId, userId, action } = req.body;

    const room = await chatRepo.findRoomById(roomId);
    if (!room || !room.admins.some((a) => (a._id || a).toString() === adminId)) {
      return res.status(403).json({ message: 'Only admins can manage members.' });
    }

    // Guard: Prevent demoting/removing yourself if you are the last admin
    if (userId === adminId && (action === 'demote' || action === 'remove')) {
      if (room.admins.length === 1) {
        return res
          .status(400)
          .json({
            message: 'You are the only admin. Please promote someone else before resigning.',
          });
      }
    }

    const updatedRoom = await chatRepo.updateGroupMember(roomId, userId, action);

    // Create system message
    let systemText = '';
    const targetUser = room.participants.find((p) => p._id.toString() === userId);
    const targetName = targetUser?.name || 'User';

    if (action === 'promote') systemText = `${targetName} is now an Admin`;
    if (action === 'demote') systemText = `${targetName} is no longer an Admin`;
    if (action === 'remove') systemText = `${targetName} was removed`;
    if (action === 'add') {
      const admin = await userRepo.findUserById(adminId);
      const target = await userRepo.findUserById(userId);
      systemText = `${admin?.name || 'Admin'} added ${target?.name || 'a member'}`;
    }

    if (systemText) {
      const message = await chatRepo.createMessage(roomId, adminId, systemText, null, 'system');
      getIO().to(roomId).emit('new_message', message);
    }

    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    const room = await chatRepo.findRoomById(roomId);
    if (!room) return res.status(404).json({ message: 'Group not found' });

    // Guard: Prevent last admin from leaving
    const isAdmin = room.admins.some((a) => (a._id || a).toString() === userId);
    if (isAdmin && room.admins.length === 1) {
      return res
        .status(400)
        .json({ message: 'You are the only admin. Promote someone else before leaving.' });
    }

    const updatedRoom = await chatRepo.updateGroupMember(roomId, userId, 'remove');

    // Create system message
    const user = await userRepo.findUserById(userId);
    const userName = user?.name || 'A member';
    const systemText = `${userName} left`;
    const message = await chatRepo.createMessage(roomId, userId, systemText, null, 'system');

    getIO().to(roomId).emit('new_message', message);

    res.json({ message: 'Left group successfully', room: updatedRoom });
  } catch (err) {
    next(err);
  }
};

export const joinGroupByLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    const updatedRoom = await chatRepo.updateGroupMember(roomId, userId, 'add');
    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    const updatedMessage = await chatRepo.editMessage(messageId, senderId, content);

    getIO().to(updatedMessage.chatRoomId.toString()).emit('message_edited', updatedMessage);

    res.json(updatedMessage);
  } catch (err) {
    next(err);
  }
};

export const deleteMessageForEveryone = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const senderId = req.user.id;

    const deletedMessage = await chatRepo.deleteMessageForEveryone(messageId, senderId);

    getIO().to(deletedMessage.chatRoomId.toString()).emit('message_deleted_everyone', {
      messageId,
      chatRoomId: deletedMessage.chatRoomId,
    });

    res.json(deletedMessage);
  } catch (err) {
    next(err);
  }
};

export const deleteMessageForMe = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await chatRepo.deleteMessageForMe(messageId, userId);
    res.json({ message: 'Deleted for me' });
  } catch (err) {
    next(err);
  }
};

export const renameGroup = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { roomId } = req.params;
    const { name } = req.body;

    const room = await chatRepo.findRoomById(roomId);
    if (!room || !room.admins.some((a) => (a._id || a).toString() === adminId)) {
      return res.status(403).json({ error: 'Only admins can rename groups.' });
    }

    const updatedRoom = await chatRepo.renameChatRoom(roomId, name);

    getIO().to(roomId).emit('group_renamed', { roomId, name });

    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const sendImageMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { roomId } = req.body;

    if (!req.file) return res.status(400).json({ message: 'No image provided' });

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'chat_images' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;
    const imageUrl = result.secure_url;

    const message = await chatRepo.createMessage(roomId, senderId, imageUrl, null, 'image');

    getIO().to(roomId).emit('new_message', message);

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};
