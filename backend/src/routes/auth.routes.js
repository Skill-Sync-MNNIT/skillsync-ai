import express from 'express';

import {
  register,
  verifyOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} from '../controllers/auth/index.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', verifyToken, logout);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

export default router;
