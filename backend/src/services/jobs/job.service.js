import { Queue } from 'bullmq';
import JobPosting from '../../models/JobPosting.js';
import redis from '../../config/redis.js';

const moderationQueue = new Queue('moderation-queue', { connection: redis });

export class JobService {
  /**
   * Create a new job posting with status 'pending_moderation'
   * and enqueue it to the moderation queue.
   */
  static async createJob(jobData, userId) {
    const job = await JobPosting.create({
      ...jobData,
      postedBy: userId,
      status: 'pending_moderation',
    });

    // Enqueue for AI moderation
    await moderationQueue.add('moderate-job', {
      jobId: job._id,
      title: job.title,
      description: job.description,
    });

    return job;
  }

  /**
   * List active jobs with pagination.
   */
  static async listActiveJobs(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      JobPosting.find({ status: 'active' })
        .sort({ deadline: 1 })
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'name email'),
      JobPosting.countDocuments({ status: 'active' }),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetch single job by ID.
   */
  static async getJobById(jobId) {
    const job = await JobPosting.findById(jobId).populate('postedBy', 'name email');
    if (!job) {
      throw new Error('Job not found');
    }
    return job;
  }

  /**
   * Withdraw a job (soft delete).
   */
  static async withdrawJob(jobId, userId) {
    const job = await JobPosting.findOneAndUpdate(
      { _id: jobId, postedBy: userId },
      { status: 'withdrawn' },
      { new: true }
    );

    if (!job) {
      throw new Error('Job not found or unauthorized');
    }
    return job;
  }
}
