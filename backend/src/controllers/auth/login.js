import { loginService } from '../../services/auth.service.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken, user } = await loginService(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
    });

    res.json({
      user,
      token: accessToken,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
