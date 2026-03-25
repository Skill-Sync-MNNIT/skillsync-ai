import { findProfileByUserId } from '../../repositories/index.js';
import { userIdParamSchema } from '../../validators/profile.validator.js';

// GET /profile/:userId
export const getProfile = async (userId) => {
  userIdParamSchema.parse({ userId });

  const profile = await findProfileByUserId(userId);
  if (!profile) throw Object.assign(new Error('Profile not found'), { status: 404 });

  return profile;
};
