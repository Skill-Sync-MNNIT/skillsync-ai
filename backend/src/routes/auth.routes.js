import express from 'express';

import { register, verifyOTP, login, refreshToken, logout } from '../controllers/auth/index.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
