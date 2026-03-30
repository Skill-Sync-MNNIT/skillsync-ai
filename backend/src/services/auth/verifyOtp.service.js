import bcrypt from 'bcrypt';
import { findUserByEmail, createUser } from '../../repositories/index.js';
import redis from '../../config/redis.js';

// POST /auth/verify-otp
export const verifyOTPService = async (email, otp) => {
  const emailLower = email.toLowerCase();

  const existingUser = await findUserByEmail(emailLower);

  if (existingUser) throw new Error('User already verified and registered');

  const payloadStr = await redis.get(`register:${emailLower}`);

  if (!payloadStr) throw new Error('OTP expired or not requested');

  const payload = JSON.parse(payloadStr);

  const valid = await bcrypt.compare(otp, payload.otpHash);

  if (!valid) throw new Error('Invalid OTP');

  await createUser({
    email: emailLower,
    passwordHash: payload.passwordHash,
    role: payload.role,
    isVerified: true,
  });

  await redis.del(`register:${emailLower}`);

  return true;
};
