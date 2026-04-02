import bcrypt from 'bcrypt';
import redis from '../../config/redis.js';
import { sendPasswordResetEmail } from '../../utils/email.js';
import { findUserByEmail } from '../../repositories/index.js';

// POST /auth/forgot-password
export const forgotPasswordService = async (email) => {
  if (!email) throw new Error('Email is required');

  const emailLower = email.toLowerCase();

  const user = await findUserByEmail(emailLower);

  if (!user) throw new Error('No account found with this email');

  if (!user.isVerified) throw new Error('Account is not verified. Please verify your email first.');

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);

  await redis.set(`forgot-password:${emailLower}`, otpHash, 'EX', 10 * 60);

  const name = emailLower.split('@')[0].split('.')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  await sendPasswordResetEmail(emailLower, otp, formattedName);

  return { message: 'Password reset OTP sent to your email' };
};
