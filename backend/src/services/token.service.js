import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const refreshTokenService = async (token) => {
  if (!token) throw new Error('No token provided');

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) throw new Error('User not found');

  if (user.refreshToken !== token) throw new Error('Invalid refresh token');

  const newAccessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  return { accessToken: newAccessToken };
};
