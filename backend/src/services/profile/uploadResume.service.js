import cloudinary from '../../config/cloudinary.js';
import { setResumeStorageKey } from '../../repositories/index.js';

// POST /profile/resume
export const uploadResume = async (userId, fileBuffer) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw Object.assign(new Error('No file provided'), { status: 400 });
  }

  // Upload PDF to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'resumes',
        resource_type: 'raw',
        type: 'private',
        public_id: `resume_${userId}_${Date.now()}`,
        format: 'pdf',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

  // Store Cloudinary public_id as resumeStorageKey (also sets embeddingStatus: 'pending')
  const profile = await setResumeStorageKey(userId, uploadResult.public_id);
  if (!profile) throw Object.assign(new Error('Profile not found'), { status: 404 });

  // Fire embedding job immediately (fire-and-forget)
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    fetch(`${aiServiceUrl}/embed/from-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId.toString(),
        storage_key: uploadResult.public_id,
      }),
    }).catch((err) =>
      console.warn('AI embedding service call failed (batch worker will retry):', err.message)
    );
  } catch (err) {
    console.warn('AI embedding service call failed (batch worker will retry):', err.message);
  }

  return {
    message: 'Resume uploaded successfully',
    resumeStorageKey: uploadResult.public_id,
    embeddingStatus: 'pending',
  };
};
