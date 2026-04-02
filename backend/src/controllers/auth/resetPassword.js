import { verifyResetOTPService, resetPasswordService } from '../../services/auth/index.js';

export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    await verifyResetOTPService(email, otp);

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const result = await resetPasswordService(email, otp, newPassword);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
