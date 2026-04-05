import bcrypt from 'bcrypt';
import {
  findUserByEmail,
  createUser,
  findProfessorByEmail,
  createStudentProfile,
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

  return true;
};
