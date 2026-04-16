import { Queue } from 'bullmq';
import JobPosting from '../../models/JobPosting.js';
import JobApplication from '../../models/JobApplication.js';
import redis from '../../config/redis.js';

const moderationQueue = new Queue('moderation-queue', { connection: redis });

export class JobService {
  /**
   * Create a new job posting with status 'pending_moderation'
   * and enqueue it to the moderation queue.
   */
  static async createJob(jobData, userId) {
    // Prevent duplicates (same user, title, and description)
    const existingJob = await JobPosting.findOne({
      postedBy: userId,
      title: jobData.title,
      description: jobData.description,
      status: { $ne: 'withdrawn' },
    });

    if (existingJob) {
      throw new Error(
        'You have already posted an identical job. Please edit the existing one or create a new opportunity.'
      );
    }

    const normalizedSkills = Array.isArray(jobData.requiredSkills)
      ? jobData.requiredSkills.map((s) => s.trim().toLowerCase())
      : [];

    const job = await JobPosting.create({
      ...jobData,
      requiredSkills: normalizedSkills,
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
   * Update an existing job.
   * Re-moderates if title or description changes.
   */
  static async updateJob(jobId, userId, updateData) {
    const job = await JobPosting.findOne({ _id: jobId, postedBy: userId });
    if (!job) throw new Error('Job not found or unauthorized');

    const criticalChange =
      (updateData.title && updateData.title !== job.title) ||
      (updateData.description && updateData.description !== job.description);

    // Update fields
    if (updateData.requiredSkills && Array.isArray(updateData.requiredSkills)) {
      updateData.requiredSkills = updateData.requiredSkills.map((s) => s.trim().toLowerCase());
    }
    Object.assign(job, updateData);

    if (criticalChange) {
      job.status = 'pending_moderation';
    }

    await job.save();

    if (criticalChange) {
      await moderationQueue.add('moderate-job', {
        jobId: job._id,
        title: job.title,
        description: job.description,
      });
    }

    return job;
  }

  /**
   * List jobs posted by a specific user (Alumni/Professor).
   */
  static async listJobsByUser(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      JobPosting.find({ postedBy: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'name email'),
      JobPosting.countDocuments({ postedBy: userId }),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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
   * Optionally checks if a student has applied.
   */
  static async getJobById(jobId, studentId = null) {
    const job = await JobPosting.findById(jobId).populate('postedBy', 'name email');
    if (!job) {
      throw new Error('Job not found');
    }

    let hasApplied = false;
    if (studentId) {
      const application = await JobApplication.findOne({ jobId, studentId });
      hasApplied = !!application;
    }

    return {
      ...job.toObject(),
      hasApplied,
    };
  }

  /**
   * Withdraw a job (soft delete).
   */
  static async withdrawJob(jobId, userId) {
    const job = await JobPosting.findOneAndUpdate(
      { _id: jobId, postedBy: userId },
      { status: 'withdrawn' },
      { returnDocument: 'after' }
    );

    if (!job) {
      throw new Error('Job not found or unauthorized');
    }
    return job;
  }
}
