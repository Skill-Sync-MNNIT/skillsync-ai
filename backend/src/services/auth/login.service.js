import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, updateRefreshToken } from '../../repositories/index.js';
import { BanManager } from '../auth/ban.manager.js';

// POST /auth/login
export const loginService = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) throw new Error('User not found');

  if (!user.isVerified) throw new Error('Please verify your email first');

  const banCheck = await BanManager.checkActiveBan(user._id);
  if (banCheck.status === 'permanent' || banCheck.status === 'temporary') {
    throw new Error(`Account Restricted: ${banCheck.message}`);
  }

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
