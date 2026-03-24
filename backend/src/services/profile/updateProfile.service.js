import { updateProfileByUserId, updateUserById } from '../../repositories/index.js';
import { updateProfileSchema } from '../../validators/profile.validator.js';

// PUT /profile
export const updateProfile = async (userId, data) => {
  const validated = updateProfileSchema.parse(data);

  if (Object.keys(validated).length === 0) {
    throw Object.assign(new Error('No valid fields to update'), { status: 400 });
  }

  const profile = await updateProfileByUserId(userId, validated);
  if (!profile) throw Object.assign(new Error('Profile not found'), { status: 404 });

  // Reactivate user on update if they were soft-deleted
  await updateUserById(userId, { isActive: true });

  return profile;
};
