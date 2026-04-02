import bcrypt from 'bcrypt';
import { sendOTPEmail } from '../../utils/email.js';
import { findUserByEmail, findProfessorByEmail } from '../../repositories/index.js';
import redis from '../../config/redis.js';

// POST /auth/register
export const registerService = async (email, password, role) => {
  if (!email || !password) throw new Error('Email and password required');

  const emailLower = email.toLowerCase();

  const existing = await findUserByEmail(emailLower);
  if (existing) throw new Error('User already exists');

  // Role-based validation
  const check = {
    student: () =>
      !/^[a-z]+\.[a-z0-9]+@mnnit\.ac\.in$/.test(emailLower) &&
      'Standard MNNIT student email required',
    professor: async () =>
      (!emailLower.endsWith('@mnnit.ac.in') || !(await findProfessorByEmail(emailLower))) &&
      'Email not found on the MNNIT website',
    alumni: () => !emailLower.includes('@') && 'Invalid email address',
  };
  const errorMsg = await check[role]?.();
  if (errorMsg) throw Object.assign(new Error(errorMsg), { status: 400 });
  //role based till here

  const passwordHash = await bcrypt.hash(password, 10);

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);

  const payload = JSON.stringify({ passwordHash, role, otpHash });
  await redis.set(`register:${emailLower}`, payload, 'EX', 600);

  const name = emailLower.split('@')[0].split('.')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  await sendOTPEmail(emailLower, otp, formattedName);

  return { message: 'OTP sent to email' };
};
