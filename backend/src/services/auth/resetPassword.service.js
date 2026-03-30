import bcrypt from 'bcrypt';
import redis from '../../config/redis.js';
import { findUserByEmail, updateUserById } from '../../repositories/index.js';

// POST /auth/verify-reset-otp
export const verifyResetOTPService = async (email, otp) => {
  const emailLower = email.toLowerCase();
  const user = await findUserByEmail(emailLower);

  if (!user) throw new Error('User not found');

  const otpHash = await redis.get(`forgot-password:${emailLower}`);

  if (!otpHash) {
    throw new Error('Reset code has expired or was not requested. Please request a new one.');
  }

  const valid = await bcrypt.compare(otp, otpHash);

  if (!valid) throw new Error('Invalid reset code');

  return true;
};

// POST /auth/reset-password
export const resetPasswordService = async (email, otp, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const emailLower = email.toLowerCase();
  const user = await findUserByEmail(emailLower);

  if (!user) throw new Error('User not found');

  const otpHash = await redis.get(`forgot-password:${emailLower}`);

  if (!otpHash) {
    throw new Error('Reset code has expired or was not requested. Please request a new one.');
  }

  const valid = await bcrypt.compare(otp, otpHash);

  if (!valid) throw new Error('Invalid reset code');

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await updateUserById(user._id, {
    passwordHash,
  });

  await redis.del(`forgot-password:${emailLower}`);

  return { message: 'Password has been reset successfully' };
};
