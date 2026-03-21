import express from 'express';

import { register, verifyOTP, login, refreshToken, logout } from '../controllers/auth/index.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', verifyToken, logout);

export default router;
