import mongoose from 'mongoose';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/models/JobPosting.js', () => ({
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    find: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/models/Notification.js', () => ({
  default: {
    insertMany: jest.fn(),
  },
}));

jest.unstable_mockModule('bullmq', () => ({
  Queue: class Queue {
    constructor() {
      this.add = jest.fn();
    }
  },
}));

const { JobService } = await import('../../src/services/jobs/job.service.js');
const { NotificationEngine } =
  await import('../../src/services/notifications/notification.engine.js');
const { default: JobPosting } = await import('../../src/models/JobPosting.js');
const { default: User } = await import('../../src/models/User.js');
const { default: Notification } = await import('../../src/models/Notification.js');

describe('Dev 3 Module E2E Flow Test', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockStudentId = new mongoose.Types.ObjectId().toString();

  it('should complete the full job lifecycle flow', async () => {
    // 1. Create a Job
    const jobData = {
      title: 'Full Stack Developer',
      description: 'A very long description for the job posting.',
      requiredSkills: ['React', 'Node.js'],
      deadline: new Date(Date.now() + 1000000),
    };

    JobPosting.create.mockResolvedValue({
      _id: 'job123',
      ...jobData,
      status: 'pending_moderation',
    });
    const job = await JobService.createJob(jobData, mockUserId);
    expect(job.status).toBe('pending_moderation');

    // 2. Simulate Moderation Pass (Status update)
    const approvedJob = { ...job, status: 'active' };
    JobPosting.findById.mockResolvedValue({
      ...approvedJob,
      title: jobData.title,
      requiredSkills: jobData.requiredSkills,
    });
    JobPosting.findByIdAndUpdate.mockResolvedValue(approvedJob);

    // 3. Trigger Notifications
    const mockStudents = [{ _id: mockStudentId }];
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockStudents),
    });
    Notification.insertMany.mockResolvedValue({});

    await NotificationEngine.triggerForNewJob('job123', jobData.title, jobData.requiredSkills);

    // Verify final state
    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'student',
        skillPreferences: { $in: ['React', 'Node.js'] },
      })
    );
    expect(Notification.insertMany).toHaveBeenCalled();
  });
});
