import { jest } from '@jest/globals';

// Mock all repository functions used by getProfile
jest.unstable_mockModule('../../../src/repositories/index.js', () => ({
  findUserById: jest.fn(),
  findProfileByUserId: jest.fn(),
}));

// Mock User model for email-prefix lookup
jest.unstable_mockModule('../../../src/models/User.js', () => ({
  default: {
    findOne: jest.fn(),
  },
}));

// Mock Zod validator to pass through
jest.unstable_mockModule('../../../src/validators/profile.validator.js', () => ({
  userIdParamSchema: {
    parse: jest.fn(),
  },
}));

const { findUserById, findProfileByUserId } = await import('../../../src/repositories/index.js');
const { default: User } = await import('../../../src/models/User.js');
const { getProfile } = await import('../../../src/services/profile/getProfile.service.js');

describe('getProfile Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lookup by MongoDB ObjectId', () => {
    it('should return merged user + profile data for a valid ID', async () => {
      const mockUser = { name: 'Alice', email: 'alice@test.com', role: 'student', isVerified: true };
      const mockProfile = { _doc: { bio: 'Developer', skills: ['JS'] } };

      findUserById.mockResolvedValue(mockUser);
      findProfileByUserId.mockResolvedValue(mockProfile);

      // Use a valid 24-char hex ID
      const result = await getProfile('aaaaaaaaaaaaaaaaaaaaaaaa');

      expect(findUserById).toHaveBeenCalledWith('aaaaaaaaaaaaaaaaaaaaaaaa');
      expect(result.name).toBe('Alice');
      expect(result.bio).toBe('Developer');
      expect(result.role).toBe('student');
    });

    it('should throw 404 if user is not found by ID', async () => {
      findUserById.mockResolvedValue(null);
      findProfileByUserId.mockResolvedValue(null);

      const err = await getProfile('aaaaaaaaaaaaaaaaaaaaaaaa').catch((e) => e);

      expect(err.message).toBe('User not found');
      expect(err.status).toBe(404);
    });
  });

  describe('lookup by email prefix', () => {
    it('should find a user by email prefix and return their profile', async () => {
      const mockUser = { _id: 'u1', name: 'Bob', email: 'bob@test.com', role: 'professor', isVerified: false };
      const mockProfile = { _doc: { department: 'CS' } };

      User.findOne.mockResolvedValue(mockUser);
      findProfileByUserId.mockResolvedValue(mockProfile);

      const result = await getProfile('bob');

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ email: expect.objectContaining({ $regex: expect.any(RegExp) }) })
      );
      expect(result.name).toBe('Bob');
      expect(result.department).toBe('CS');
    });

    it('should throw 404 if no user matches the email prefix', async () => {
      User.findOne.mockResolvedValue(null);

      const err = await getProfile('nonexistent').catch((e) => e);

      expect(err.message).toBe('User not found');
      expect(err.status).toBe(404);
    });
  });
});
