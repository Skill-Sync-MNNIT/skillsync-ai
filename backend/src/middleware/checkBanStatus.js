import User from '../models/User.js';

export const checkBanStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isBanned) return res.status(403).json({ message: 'User banned' });

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
