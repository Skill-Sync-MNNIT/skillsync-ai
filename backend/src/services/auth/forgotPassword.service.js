import bcrypt from 'bcrypt';
import { sendPasswordResetEmail } from '../../utils/email.js';
import { findUserByEmail, setUserOtp } from '../../repositories/index.js';

// POST /auth/forgot-password
export const forgotPasswordService = async (email) => {
  if (!email) throw new Error('Email is required');

  const emailLower = email.toLowerCase();

  const user = await findUserByEmail(emailLower);

  if (!user) throw new Error('No account found with this email');

  if (!user.isVerified) throw new Error('Account is not verified. Please verify your email first.');

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);

  // Store OTP on user (reuses existing otpHash/otpExpiresAt fields)
  await setUserOtp(user._id, otpHash, Date.now() + 10 * 60 * 1000);

  // Send password-reset email
  const name = emailLower.split('@')[0].split('.')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  await sendPasswordResetEmail(emailLower, otp, formattedName);

  return { message: 'Password reset OTP sent to your email' };
};
