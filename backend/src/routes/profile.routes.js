import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { uploadResume as uploadMiddleware } from '../middleware/upload.js';
import {
  getProfile,
  updateProfile,
  uploadResume,
  getResumeUrl,
  deleteProfile,
} from '../controllers/profile/index.js';

const router = express.Router();

// GET /profile/resume/:userId – must be before /profile/:userId to avoid route conflict
router.get('/resume/:userId', verifyToken, getResumeUrl);

// GET /profile/:userId – fetch student profile
router.get('/:userId', verifyToken, getProfile);

// PUT /profile – update branch, year, skills
router.put('/', verifyToken, updateProfile);

// POST /profile/resume – upload PDF resume
router.post('/resume', verifyToken, uploadMiddleware, uploadResume);

// DELETE /profile – soft delete profile
router.delete('/', verifyToken, deleteProfile);

export default router;
