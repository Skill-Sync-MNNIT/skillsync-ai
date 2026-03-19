import { refreshTokenService } from '../../services/token.service.js';

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    const result = await refreshTokenService(token);

    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
