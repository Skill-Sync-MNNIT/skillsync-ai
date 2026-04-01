import mongoose from 'mongoose';
import { JobService } from '../../../src/services/jobs/job.service.js';
import { NotificationEngine } from '../../../src/services/notifications/notification.engine.js';
import JobPosting from '../../../src/models/JobPosting.js';
import User from '../../../src/models/User.js';
import Notification from '../../../src/models/Notification.js';

// This is an integration test suite. In a real CI environment, 
// we would use a test database. Here we mock the DB for the purpose of the flow test.
jest.mock('../../../src/models/JobPosting.js');
jest.mock('../../../src/models/User.js');
jest.mock('../../../src/models/Notification.js');
jest.mock('bullmq'); // Mock moderation queue

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

    JobPosting.create.mockResolvedValue({ _id: 'job123', ...jobData, status: 'pending_moderation' });
    const job = await JobService.createJob(jobData, mockUserId);
    expect(job.status).toBe('pending_moderation');

    // 2. Simulate Moderation Pass (Status update)
    const approvedJob = { ...job, status: 'active' };
    JobPosting.findById.mockResolvedValue({ ...approvedJob, title: jobData.title, requiredSkills: jobData.requiredSkills });
    JobPosting.findByIdAndUpdate.mockResolvedValue(approvedJob);

    // 3. Trigger Notifications
    const mockStudents = [{ _id: mockStudentId }];
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockStudents),
    });
    Notification.insertMany.mockResolvedValue({});

    await NotificationEngine.triggerForNewJob('job123', jobData.title, jobData.requiredSkills);

    // Verify final state
    expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
      role: 'student',
      skillPreferences: { $in: ['React', 'Node.js'] },
    }));
    expect(Notification.insertMany).toHaveBeenCalled();
  });
});
