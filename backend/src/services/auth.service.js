import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { sendOTPEmail } from '../utils/email.js';
import { findUserByEmail, createUser, updateRefreshToken } from '../repositories/index.js';

// register service
export const registerService = async (email, password, role) => {
  if (!email || !password) throw new Error('Email and password required');

  const emailLower = email.toLowerCase();

  if (!emailLower.endsWith('@mnnit.ac.in')) throw new Error('Only MNNIT emails allowed');

  const existing = await findUserByEmail(emailLower);

  if (existing) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 10);

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);

  await createUser({
    email: emailLower,
    role: role,
    passwordHash,
    otpHash,
    otpExpiresAt: Date.now() + 10 * 60 * 1000,
  });

  const name = emailLower.split('@')[0].split('.')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  await sendOTPEmail(emailLower, otp, formattedName);

  return { message: 'OTP sent to email' };
};

// login service
export const loginService = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) throw new Error('User not found');

  if (!user.isVerified) throw new Error('Please verify your email first');

  if (user.isBanned) throw new Error('User banned');

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) throw new Error('Invalid credentials');

  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  await updateRefreshToken(user._id, refreshToken);

  return { accessToken, refreshToken, user };
};
