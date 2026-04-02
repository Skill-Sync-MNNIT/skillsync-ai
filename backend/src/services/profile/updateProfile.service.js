import { updateProfileByUserId, updateUserById } from '../../repositories/index.js';
import { updateProfileSchema } from '../../validators/profile.validator.js';

// PUT /profile
export const updateProfile = async (userId, data) => {
  const validated = updateProfileSchema.parse(data);

  if (Object.keys(validated).length === 0) {
    throw Object.assign(new Error('No valid fields to update'), { status: 400 });
  }

  const { name, ...profileFields } = validated;

  //update user document
  const userUpdate = { isActive: true };
  if (name !== undefined) userUpdate.name = name;

  const user = await updateUserById(userId, userUpdate);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  let profile = null;

  //update student profile if user is student
  if (user.role === 'student') {
    profile = await updateProfileByUserId(userId, profileFields);
  }

  // Return a merged object for the frontend
  return {
    ...profile?._doc,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
};
