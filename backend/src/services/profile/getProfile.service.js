import { findProfileByUserId, findUserById } from '../../repositories/index.js';
import { userIdParamSchema } from '../../validators/profile.validator.js';
import User from '../../models/User.js';

// GET /profile/:userId   (or /profile/:emailPrefix)
export const getProfile = async (identifier) => {
  userIdParamSchema.parse({ userId: identifier });

  let user;
  let profile;

  if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
    // Lookup by ID
    [user, profile] = await Promise.all([
      findUserById(identifier),
      findProfileByUserId(identifier),
    ]);
  } else {
    // Lookup by email prefix (e.g., yugank.2024ca116 matches yugank.2024ca116@...)
    user = await User.findOne({ email: { $regex: new RegExp(`^${identifier}@`, 'i') } });
    if (user) {
      profile = await findProfileByUserId(user._id);
    }
  }

  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  return {
    ...profile?._doc,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
};
