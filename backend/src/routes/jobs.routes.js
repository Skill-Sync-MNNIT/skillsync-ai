import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkBan } from '../middleware/checkBan.middleware.js';
import {
  createJob,
  listJobs,
  listMyJobs,
  getJob,
  updateJob,
  withdrawJob,
} from '../controllers/jobs/job.controller.js';
import {
  applyToJob,
  getApplicationsForJob,
  updateApplicationStatus,
} from '../controllers/jobs/application.controller.js';

const router = express.Router();

router.post('/', verifyToken, checkBan, createJob);

router.get('/', verifyToken, listJobs);

router.get('/my', verifyToken, listMyJobs);

router.get('/:jobId', verifyToken, getJob);

router.patch('/:jobId', verifyToken, checkBan, updateJob);

router.delete('/:jobId', verifyToken, withdrawJob);

router.post('/:jobId/apply', verifyToken, checkBan, applyToJob);

router.get('/:jobId/applications', verifyToken, getApplicationsForJob);

router.patch('/applications/:applicationId/status', verifyToken, updateApplicationStatus);

export default router;
