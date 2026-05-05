import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { uploadResume as uploadMiddleware } from '../middleware/upload.js';
import {
  getProfile,
  updateProfile,
  uploadResume,
  getResumeUrl,
} from '../controllers/profile/index.js';

const router = express.Router();

router.get('/resume/:userId', verifyToken, getResumeUrl);

router.get('/:userId', verifyToken, getProfile);

router.put('/', verifyToken, updateProfile);

router.post('/resume', verifyToken, uploadMiddleware, uploadResume);

export default router;
