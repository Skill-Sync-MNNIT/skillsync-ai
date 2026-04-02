import { refreshTokenService } from '../../services/auth/index.js';

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    const result = await refreshTokenService(token);

    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
