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

    // Fire metadata sync to AI Service asynchronously
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const payload = {};
      if (profileFields.cpi !== undefined) payload.cpi = profileFields.cpi;
      if (profileFields.course !== undefined) payload.course = profileFields.course;
      if (profileFields.branch !== undefined) payload.branch = profileFields.branch;
      if (profileFields.year !== undefined) payload.year = profileFields.year;
      if (profileFields.skills !== undefined) payload.skills = profileFields.skills;

      if (Object.keys(payload).length > 0) {
        fetch(`${aiServiceUrl}/embed/metadata/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => console.warn('AI metadata sync failed (non-critical):', err.message));
      }
    } catch (err) {
      console.warn('AI metadata sync error:', err.message);
    }
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
