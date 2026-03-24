import { verifyOTPService } from '../../services/auth/index.js';

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    await verifyOTPService(email, otp);

    res.json({ message: 'Account verified successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
