import bcrypt from 'bcrypt';
import { findUserByEmail, updateUserById } from '../../repositories/index.js';

// POST /auth/verify-reset-otp
export const verifyResetOTPService = async (email, otp) => {
  const user = await findUserByEmail(email.toLowerCase());

  if (!user) throw new Error('User not found');

  if (!user.otpHash) throw new Error('No reset code was requested');

  if (user.otpExpiresAt < Date.now())
    throw new Error('Reset code has expired. Please request a new one.');

  const valid = await bcrypt.compare(otp, user.otpHash);

  if (!valid) throw new Error('Invalid reset code');

  return true;
};

// POST /auth/reset-password
export const resetPasswordService = async (email, otp, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const user = await findUserByEmail(email.toLowerCase());

  if (!user) throw new Error('User not found');

  if (!user.otpHash) throw new Error('No reset code was requested');

  if (user.otpExpiresAt < Date.now())
    throw new Error('Reset code has expired. Please request a new one.');

  const valid = await bcrypt.compare(otp, user.otpHash);

  if (!valid) throw new Error('Invalid reset code');

  // Hash the new password and clear OTP fields atomically
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await updateUserById(user._id, {
    passwordHash,
    otpHash: null,
    otpExpiresAt: null,
  });

  return { message: 'Password has been reset successfully' };
};
