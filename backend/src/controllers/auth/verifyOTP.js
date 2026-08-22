import { verifyOTPService } from '../../services/auth/index.js';

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const { user, accessToken, refreshToken } = await verifyOTPService(email, otp);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      message: 'Email verified! Welcome to SkillSync',
      user,
      token: accessToken,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
