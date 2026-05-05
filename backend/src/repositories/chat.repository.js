import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';

export const createRoom = async (participants, isGroup = false, name = null, admins = []) => {
  const roomData = {
    participants,
    isGroup,
    name,
    admins: isGroup ? admins : [],
  };
  if (isGroup) {
    roomData.inviteCode = Math.random().toString(36).substring(2, 9);
  }
  return await ChatRoom.create(roomData);
};

export const findRoomById = async (roomId) => {
  return await ChatRoom.findById(roomId)
    .populate('participants', 'name email role isOnline lastSeen')
    .populate('admins', 'name email');
};

export const find1on1Room = async (userAId, userBId) => {
  return await ChatRoom.findOne({
    isGroup: false,
    participants: { $all: [userAId, userBId], $size: 2 },
  });
};

export const getUserRooms = async (userId) => {
  const rooms = await ChatRoom.find({ participants: userId })
    .populate('participants', 'name email role isOnline lastSeen')
    .populate('lastMessageDetails')
    .sort({ updatedAt: -1 });

  const roomsWithUnread = await Promise.all(
    rooms.map(async (room) => {
      const unreadCount = await ChatMessage.countDocuments({
        chatRoomId: room._id,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      });
      return { ...room.toObject(), unreadCount };
    })
  );

  return roomsWithUnread;
};

export const createMessage = async (
  roomId,
  senderId,
  content,
  replyTo = null,
  messageType = 'text',
  fileName = null
) => {
  const message = await ChatMessage.create({
    chatRoomId: roomId,
    senderId,
    content,
    replyTo,
    messageType,
    fileName,
  });
  // Summarize for last message
  let lastMsgSummary = content;
  if (messageType === 'image') lastMsgSummary = '📷 Photo';
  if (messageType === 'file') lastMsgSummary = '📎 Document';

  await ChatRoom.findByIdAndUpdate(roomId, {
    lastMessage: lastMsgSummary,
    lastMessageAt: Date.now(),
    lastMessageDetails: message._id,
  });
  return await message.populate([
    { path: 'senderId', select: 'name' },
    {
      path: 'replyTo',
      select: 'content messageType senderId',
      populate: { path: 'senderId', select: 'name' },
    },
  ]);
};

export const sendFileMessage = async (
  roomId,
  senderId,
  fileUrl,
  fileName,
  messageType = 'file'
) => {
  const message = await ChatMessage.create({
    chatRoomId: roomId,
    senderId,
    content: fileUrl,
    fileName,
    messageType,
  });

  await ChatRoom.findByIdAndUpdate(roomId, {
    lastMessage: '📎 Document',
    lastMessageAt: Date.now(),
    lastMessageDetails: message._id,
  });

  return await message.populate('senderId', 'name');
};

export const updateGroupMember = async (roomId, userId, action) => {
  const room = await ChatRoom.findById(roomId);
  if (!room || !room.isGroup) throw new Error('Not a group chat');

  switch (action) {
    case 'promote':
      return await ChatRoom.findByIdAndUpdate(
        roomId,
        { $addToSet: { admins: userId } },
        { returnDocument: 'after' }
      );
    case 'demote':
      return await ChatRoom.findByIdAndUpdate(
        roomId,
        { $pull: { admins: userId } },
        { returnDocument: 'after' }
      );
    case 'remove':
      return await ChatRoom.findByIdAndUpdate(
        roomId,
        {
          $pull: { participants: userId, admins: userId },
        },
        { returnDocument: 'after' }
      );
    case 'add':
      return await ChatRoom.findByIdAndUpdate(
        roomId,
        {
          $addToSet: { participants: userId },
        },
        { returnDocument: 'after' }
      );
    default:
      return room;
  }
};

export const findRoomByInviteCode = async (inviteCode) => {
  return await ChatRoom.findOne({ inviteCode });
};

export const getRoomMessages = async (roomId) => {
  return await ChatMessage.find({ chatRoomId: roomId })
    .sort({ createdAt: 1 })
    .populate([
      { path: 'senderId', select: 'name' },
      {
        path: 'replyTo',
        select: 'content messageType senderId',
        populate: { path: 'senderId', select: 'name' },
      },
    ]);
};

export const deleteChatRoom = async (roomId) => {
  await ChatMessage.deleteMany({ chatRoomId: roomId });
  return await ChatRoom.findByIdAndDelete(roomId);
};

export const clearChatMessages = async (roomId) => {
  await ChatMessage.deleteMany({ chatRoomId: roomId });
  return await ChatRoom.findByIdAndUpdate(
    roomId,
    {
      lastMessage: 'Messages cleared',
      lastMessageAt: Date.now(),
    },
    { returnDocument: 'after' }
  );
};

export const editMessage = async (messageId, senderId, newContent) => {
  const message = await ChatMessage.findById(messageId);
  if (!message || message.senderId.toString() !== senderId) {
    throw new Error('Unauthorized or message not found');
  }

  // Guard: Only text messages can be edited.
  // We check if it exists because legacy text messages might not have this field.
  if (message.messageType && message.messageType !== 'text') {
    throw new Error('Only text messages can be edited');
  }

  // Enforce 30 min edit limit
  const diff = (Date.now() - message.createdAt.getTime()) / (1000 * 60);
  if (diff > 30) {
    throw new Error('Editing window (30m) has expired');
  }

  return await ChatMessage.findByIdAndUpdate(
    messageId,
    { content: newContent, isEdited: true },
    { returnDocument: 'after' }
  ).populate('senderId', 'name');
};

export const deleteMessageForEveryone = async (messageId, senderId) => {
  const message = await ChatMessage.findById(messageId);
  if (!message || message.senderId.toString() !== senderId) {
    throw new Error('Unauthorized or message not found');
  }

  // Enforce 5 hour delete limit
  const diff = (Date.now() - message.createdAt.getTime()) / (1000 * 60);
  if (diff > 5 * 60) {
    throw new Error('Delete for everyone window (5h) has expired');
  }

  const updated = await ChatMessage.findByIdAndUpdate(
    messageId,
    { isDeletedForEveryone: true, content: 'This message was deleted' },
    { returnDocument: 'after' }
  );

  // Sync room preview
  await ChatRoom.findByIdAndUpdate(message.chatRoomId, {
    lastMessage: 'This message was deleted',
  });

  return updated;
};

export const deleteMessageForMe = async (messageId, userId) => {
  return await ChatMessage.findByIdAndUpdate(
    messageId,
    { $addToSet: { deletedBy: userId } },
    { returnDocument: 'after' }
  );
};

export const renameChatRoom = async (roomId, newName) => {
  return await ChatRoom.findByIdAndUpdate(roomId, { name: newName }, { returnDocument: 'after' });
};

export const markMessageAsDelivered = async (messageId, userId) => {
  return await ChatMessage.findByIdAndUpdate(
    messageId,
    { $addToSet: { deliveredTo: userId } },
    { returnDocument: 'after' }
  );
};

export const markMessagesAsRead = async (roomId, userId) => {
  return await ChatMessage.updateMany(
    {
      chatRoomId: roomId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );
};
