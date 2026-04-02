import { findUserByRefreshToken, updateRefreshToken } from '../../repositories/index.js';

// POST /auth/logout
export const logoutService = async (token) => {
  if (!token) return;

  const user = await findUserByRefreshToken(token);

  if (user) {
    await updateRefreshToken(user._id, null);
  }
};
