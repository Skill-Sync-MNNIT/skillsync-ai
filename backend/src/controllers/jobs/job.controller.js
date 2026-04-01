import { JobService } from '../../services/jobs/job.service.js';
import { jobPostingSchema } from '../../validators/jobs.validator.js';

export const createJob = async (req, res, next) => {
  try {
    const validatedData = jobPostingSchema.parse(req.body);
    const job = await JobService.createJob(validatedData, req.user.id);
    res.status(201).json({
      jobId: job._id,
      status: job.status,
      message: 'Job status: pending_moderation. Enqueued to moderation queue.',
    });
  } catch (error) {
    next(error);
  }
};

export const listJobs = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await JobService.listActiveJobs(Number(page) || 1, Number(limit) || 10);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const job = await JobService.getJobById(req.params.jobId);
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

export const withdrawJob = async (req, res, next) => {
  try {
    await JobService.withdrawJob(req.params.jobId, req.user.id);
    res.status(200).json({ message: 'Job status: withdrawn' });
  } catch (error) {
    next(error);
  }
};
