import bcrypt from 'bcrypt';
import { findUserByEmail, markUserVerified } from '../repositories/index.js';

export const verifyOTPService = async (email, otp) => {
  const user = await findUserByEmail(email);

  if (!user) throw new Error('User not found');

  if (user.isVerified) throw new Error('User already verified');

  if (!user.otpHash) throw new Error('OTP not requested');

  if (user.otpExpiresAt < Date.now()) throw new Error('OTP expired');

  const valid = await bcrypt.compare(otp, user.otpHash);

  if (!valid) throw new Error('Invalid OTP');

  await markUserVerified(user._id);

  return true;
};
