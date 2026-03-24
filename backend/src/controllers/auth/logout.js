import { logoutService } from '../../services/auth/index.js';

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    await logoutService(token);

    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
