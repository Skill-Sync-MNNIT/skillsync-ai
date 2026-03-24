import cloudinary from '../../config/cloudinary.js';
import { findProfileByUserId, createDownloadLog } from '../../repositories/index.js';
import { userIdParamSchema } from '../../validators/profile.validator.js';

// GET /profile/resume/:userId
export const getResumeUrl = async (requesterId, targetUserId) => {
  userIdParamSchema.parse({ userId: targetUserId });

  const profile = await findProfileByUserId(targetUserId);
  if (!profile || !profile.resumeStorageKey) {
    throw Object.assign(new Error('Resume not found'), { status: 404 });
  }

  // Generate Cloudinary signed URL with 15-minute TTL
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

  const signedUrl = cloudinary.utils.private_download_url(profile.resumeStorageKey, '', {
    type: 'private',
    resource_type: 'raw',
    expires_at: expiresAt,
  });

  // Log the download
  await createDownloadLog(requesterId, targetUserId);

  return { url: signedUrl, expiresIn: '15 minutes' };
};
