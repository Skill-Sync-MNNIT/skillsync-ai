import { jest } from '@jest/globals';

// Mock both Mongoose models
jest.unstable_mockModule('../../../src/models/ChatRoom.js', () => ({
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/models/ChatMessage.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
}));

const { default: ChatRoom } = await import('../../../src/models/ChatRoom.js');
const { default: ChatMessage } = await import('../../../src/models/ChatMessage.js');
const chatRepo = await import('../../../src/repositories/chat.repository.js');

describe('ChatRepository Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a 1-on-1 chat room', async () => {
      const mockRoom = { _id: 'room1', participants: ['u1', 'u2'], isGroup: false };
      ChatRoom.create.mockResolvedValue(mockRoom);

      const result = await chatRepo.createRoom(['u1', 'u2']);

      expect(ChatRoom.create).toHaveBeenCalledWith(
        expect.objectContaining({ participants: ['u1', 'u2'], isGroup: false })
      );
      expect(result).toEqual(mockRoom);
    });

    it('should create a group room with an invite code', async () => {
      const mockRoom = { _id: 'room2', isGroup: true, inviteCode: 'abc123' };
      ChatRoom.create.mockResolvedValue(mockRoom);

      const result = await chatRepo.createRoom(['u1', 'u2', 'u3'], true, 'My Group', ['u1']);

      expect(ChatRoom.create).toHaveBeenCalledWith(
        expect.objectContaining({ isGroup: true, name: 'My Group', inviteCode: expect.any(String) })
      );
      expect(result.isGroup).toBe(true);
    });
  });

  describe('editMessage', () => {
    it('should throw if message is not found or sender is not the owner', async () => {
      ChatMessage.findById.mockResolvedValue({
        senderId: { toString: () => 'other_user' },
        createdAt: new Date(),
      });

      await expect(chatRepo.editMessage('msg1', 'user1', 'new content')).rejects.toThrow(
        'Unauthorized or message not found'
      );
    });

    it('should throw if the edit window has expired', async () => {
      const oldDate = new Date(Date.now() - 31 * 60 * 1000); // 31 min ago
      ChatMessage.findById.mockResolvedValue({
        senderId: { toString: () => 'user1' },
        messageType: 'text',
        createdAt: oldDate,
      });

      await expect(chatRepo.editMessage('msg1', 'user1', 'updated')).rejects.toThrow(
        'Editing window (30m) has expired'
      );
    });

    it('should successfully edit a text message within time window', async () => {
      const recentDate = new Date();
      const mockMsg = {
        _id: 'msg1',
        senderId: { toString: () => 'user1' },
        messageType: 'text',
        createdAt: recentDate,
      };
      const updatedMsg = { ...mockMsg, content: 'new content', isEdited: true };

      ChatMessage.findById.mockResolvedValue(mockMsg);
      ChatMessage.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedMsg),
      });

      const result = await chatRepo.editMessage('msg1', 'user1', 'new content');

      expect(ChatMessage.findByIdAndUpdate).toHaveBeenCalledWith(
        'msg1',
        { content: 'new content', isEdited: true },
        { returnDocument: 'after' }
      );
      expect(result.isEdited).toBe(true);
    });
  });

  describe('deleteMessageForEveryone', () => {
    it('should throw if the 5-hour delete window has expired', async () => {
      const veryOldDate = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago
      ChatMessage.findById.mockResolvedValue({
        senderId: { toString: () => 'user1' },
        createdAt: veryOldDate,
      });

      await expect(chatRepo.deleteMessageForEveryone('msg1', 'user1')).rejects.toThrow(
        'Delete for everyone window (5h) has expired'
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('should call updateMany with correct filter', async () => {
      ChatMessage.updateMany.mockResolvedValue({ modifiedCount: 3 });

      await chatRepo.markMessagesAsRead('room1', 'user1');

      expect(ChatMessage.updateMany).toHaveBeenCalledWith(
        { chatRoomId: 'room1', senderId: { $ne: 'user1' }, readBy: { $ne: 'user1' } },
        { $addToSet: { readBy: 'user1' } }
      );
    });
  });
});
