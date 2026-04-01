import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkBan } from '../middleware/checkBan.middleware.js';
import { createJob, listJobs, getJob, withdrawJob } from '../controllers/jobs/job.controller.js';

const router = express.Router();

/**
 * @route   POST /jobs
 * @desc    Create a new job (Alumni/Professor only)
 */
router.post(
  '/',
  verifyToken,
  checkBan,
  // Add role middleware if available...
  createJob
);

/**
 * @route   GET /jobs
 * @desc    List all active jobs (paginated)
 */
router.get('/', verifyToken, listJobs);

/**
 * @route   GET /jobs/:jobId
 * @desc    Fetch single job with profile info
 */
router.get('/:jobId', verifyToken, getJob);

/**
 * @route   DELETE /jobs/:jobId
 * @desc    Withdraw job posting (Alumni/Professor who posted it)
 */
router.delete('/:jobId', verifyToken, withdrawJob);

export default router;
