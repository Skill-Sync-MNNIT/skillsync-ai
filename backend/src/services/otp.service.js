import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const verifyOTPService = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) throw new Error('User not found');

  if (user.isVerified) throw new Error('User already verified');

  if (!user.otpHash) throw new Error('OTP not requested');

  if (user.otpExpiresAt < Date.now()) throw new Error('OTP expired');

  const valid = await bcrypt.compare(otp, user.otpHash);

  if (!valid) throw new Error('Invalid OTP');

  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return true;
};
