import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/models/User.js', () => {
  return {
    default: {
      find: jest.fn(),
    }
  };
});

jest.unstable_mockModule('../../../src/models/Notification.js', () => {
  return {
    default: {
      insertMany: jest.fn(),
    }
  };
});

const { default: User } = await import('../../../src/models/User.js');
const { default: Notification } = await import('../../../src/models/Notification.js');
const { NotificationEngine } = await import('../../../src/services/notifications/notification.engine.js');

describe('NotificationEngine Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerForNewJob', () => {
    it('should create notifications for matching users', async () => {
      const mockUsers = [
        { _id: 'user1', name: 'User One' },
        { _id: 'user2', name: 'User Two' },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });
      Notification.insertMany.mockResolvedValue({});

      await NotificationEngine.triggerForNewJob('job123', 'Test Job', ['Skill1', 'Skill2']);

      expect(User.find).toHaveBeenCalledWith({
        role: 'student',
        isActive: true,
        skillPreferences: { $in: ['Skill1', 'Skill2'] },
      });
      expect(Notification.insertMany).toHaveBeenCalledWith([
        { userId: 'user1', jobId: 'job123', message: expect.any(String) },
        { userId: 'user2', jobId: 'job123', message: expect.any(String) },
      ], { ordered: false });
    });

    it('should do nothing if no matching users are found', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await NotificationEngine.triggerForNewJob('job123', 'Test Job', ['Skill1']);

      expect(Notification.insertMany).not.toHaveBeenCalled();
    });
  });
});
