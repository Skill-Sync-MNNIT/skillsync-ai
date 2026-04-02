import { findProfileByUserId, findUserById } from '../../repositories/index.js';
import { userIdParamSchema } from '../../validators/profile.validator.js';

// GET /profile/:userId
export const getProfile = async (userId) => {
  userIdParamSchema.parse({ userId });

  const [user, profile] = await Promise.all([findUserById(userId), findProfileByUserId(userId)]);

  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  return {
    ...profile?._doc,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
};
