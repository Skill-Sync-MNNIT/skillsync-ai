import bcrypt from 'bcrypt';
import { sendOTPEmail } from '../../utils/email.js';
import { findUserByEmail, createUser } from '../../repositories/index.js';

// POST /auth/register
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
