import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/models/User.js', () => {
  return {
    default: {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    }
  };
});

const { BanManager } = await import('../../../src/services/auth/ban.manager.js');
const { default: User } = await import('../../../src/models/User.js');

describe('BanManager Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('applyViolationPolicy', () => {
    it('should apply a 3-day ban for the first violation', async () => {
      const mockUser = { _id: 'user123', violationCount: 0 };
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue({});

      const result = await BanManager.applyViolationPolicy('user123');

      expect(result.violationCount).toBe(1);
      expect(result.banUntil).toBeInstanceOf(Date);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', expect.objectContaining({
        violationCount: 1,
      }));
    });

    it('should apply a permanent ban for the second violation', async () => {
      const mockUser = { _id: 'user123', violationCount: 1 };
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue({});

      const result = await BanManager.applyViolationPolicy('user123');

      expect(result.violationCount).toBe(2);
      expect(result.isBanned).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', expect.objectContaining({
        isBanned: true,
      }));
    });
  });

  describe('checkActiveBan', () => {
    it('should return active status for a clean user', async () => {
      User.findById.mockResolvedValue({ _id: 'user123', isBanned: false, banUntil: null });
      const result = await BanManager.checkActiveBan('user123');
      expect(result.status).toBe('active');
    });

    it('should return permanent status for a permanently banned user', async () => {
      User.findById.mockResolvedValue({ _id: 'user123', isBanned: true });
      const result = await BanManager.checkActiveBan('user123');
      expect(result.status).toBe('permanent');
    });

    it('should return temporary status for a temporarily banned user', async () => {
      const futureDate = new Date(Date.now() + 100000);
      User.findById.mockResolvedValue({ _id: 'user123', isBanned: false, banUntil: futureDate });
      const result = await BanManager.checkActiveBan('user123');
      expect(result.status).toBe('temporary');
    });
  });
});
