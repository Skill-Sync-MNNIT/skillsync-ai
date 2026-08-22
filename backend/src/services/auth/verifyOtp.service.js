import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  createUser,
  findProfessorByEmail,
  createStudentProfile,
  updateRefreshToken,
} from '../../repositories/index.js';
import redis from '../../config/redis.js';

// POST /auth/verify-otp
export const verifyOTPService = async (email, otp) => {
  const emailLower = email.toLowerCase();

  const existingUser = await findUserByEmail(emailLower);

  if (existingUser) throw new Error('User already verified and registered');

  const payloadStr = await redis.get(`register:${emailLower}`);

  if (!payloadStr) throw new Error('OTP expired or not requested');

  const payload = JSON.parse(payloadStr);

  const valid = await bcrypt.compare(otp, payload.otpHash);

  if (!valid) throw new Error('Invalid OTP');

  //name for professor is taken from professorDirectory
  let name = null;
  if (payload.role === 'professor') {
    const prof = await findProfessorByEmail(emailLower);
    if (prof) name = prof.name;
  }

  if (!name) {
    name = emailLower.split('@')[0].split('.')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  const user = await createUser({
    email: emailLower,
    name: name,
    passwordHash: payload.passwordHash,
    role: payload.role,
    isVerified: true,
  });

  if (payload.role === 'student') {
    await createStudentProfile({ userId: user._id });
  }

  await redis.del(`register:${emailLower}`);

  // Generate tokens so the controller can auto-login the user
  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  });

  await updateRefreshToken(user._id, refreshToken);

  return { user, accessToken, refreshToken };
};
