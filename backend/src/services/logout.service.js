import User from '../models/User.js';

export const logoutService = async (token) => {
  if (!token) return;

  const user = await User.findOne({ refreshToken: token });

  if (user) {
    user.refreshToken = null;
    await user.save();
  }
};
