import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, updateRefreshToken } from '../../repositories/index.js';

// POST /auth/login
export const loginService = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) throw new Error('User not found');

  if (!user.isVerified) throw new Error('Please verify your email first');

  if (user.isBanned) throw new Error('User banned');

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) throw new Error('Invalid credentials');

  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  });

  await updateRefreshToken(user._id, refreshToken);

  return { accessToken, refreshToken, user };
};
