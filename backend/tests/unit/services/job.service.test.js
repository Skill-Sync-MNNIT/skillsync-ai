import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/models/JobPosting.js', () => {
  return {
    default: {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
    }
  };
});

jest.unstable_mockModule('bullmq', () => {
  return {
    Queue: class Queue {
      constructor() {
        this.add = jest.fn().mockResolvedValue({ id: 'job_queue_id' });
      }
    }
  };
});

const { default: JobPosting } = await import('../../../src/models/JobPosting.js');
const { Queue } = await import('bullmq');
const { JobService } = await import('../../../src/services/jobs/job.service.js');

describe('JobService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job and enqueue it for moderation', async () => {
      const mockJobData = { title: 'Test Job', description: 'Test Description', requiredSkills: ['Skill1'] };
      const mockUserId = 'user123';
      const mockJob = { ...mockJobData, _id: 'job123', status: 'pending_moderation' };

      JobPosting.create.mockResolvedValue(mockJob);

      const result = await JobService.createJob(mockJobData, mockUserId);

      expect(JobPosting.create).toHaveBeenCalledWith({
        ...mockJobData,
        postedBy: mockUserId,
        status: 'pending_moderation',
      });
      expect(result).toEqual(mockJob);
    });
  });

  describe('listActiveJobs', () => {
    it('should return a paginated list of active jobs', async () => {
      const mockJobs = [{ title: 'Job 1', status: 'active' }, { title: 'Job 2', status: 'active' }];
      const mockTotal = 2;

      JobPosting.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockJobs),
      });
      JobPosting.countDocuments.mockResolvedValue(mockTotal);

      const result = await JobService.listActiveJobs(1, 10);

      expect(result.jobs).toEqual(mockJobs);
      expect(result.total).toEqual(mockTotal);
      expect(result.page).toEqual(1);
      expect(result.totalPages).toEqual(1);
    });
  });

  describe('getJobById', () => {
    it('should return a job by ID', async () => {
      const mockJob = { title: 'Test Job', _id: 'job123' };
      JobPosting.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockJob),
      });

      const result = await JobService.getJobById('job123');

      expect(result).toEqual(mockJob);
    });

    it('should throw an error if job is not found', async () => {
      JobPosting.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(JobService.getJobById('job123')).rejects.toThrow('Job not found');
    });
  });

  describe('withdrawJob', () => {
    it('should mark a job as withdrawn', async () => {
      const mockJob = { _id: 'job123', status: 'withdrawn' };
      JobPosting.findOneAndUpdate.mockResolvedValue(mockJob);

      const result = await JobService.withdrawJob('job123', 'user123');

      expect(JobPosting.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'job123', postedBy: 'user123' },
        { status: 'withdrawn' },
        { new: true }
      );
      expect(result).toEqual(mockJob);
    });

    it('should throw an error if job is not found or unauthorized', async () => {
      JobPosting.findOneAndUpdate.mockResolvedValue(null);

      await expect(JobService.withdrawJob('job123', 'user123')).rejects.toThrow('Job not found or unauthorized');
    });
  });
});
