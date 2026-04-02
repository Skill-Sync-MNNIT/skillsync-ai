import StudentProfile from '../models/StudentProfile.js';

// ─── Create ───────────────────────────────────────────────────────────────────
/**
 * Create a new student profile.
 * @param {Object} data - Fields to set on the new StudentProfile.
 * @returns {Promise<StudentProfile>}
 */
export const createStudentProfile = async (data) => {
  return await StudentProfile.create(data);
};

// ─── Read ─────────────────────────────────────────────────────────────────────
/**
 * Find a student profile by the linked user's ObjectId.
 * @param {string} userId
 * @returns {Promise<StudentProfile|null>}
 */
export const findProfileByUserId = async (userId) => {
  return await StudentProfile.findOne({ userId });
};

/**
 * Find a student profile by its own _id.
 * @param {string} id
 * @returns {Promise<StudentProfile|null>}
 */
export const findProfileById = async (id) => {
  return await StudentProfile.findById(id);
};

/**
 * Get all student profiles whose embedding status matches a given value.
 * Useful for the worker that processes pending resume embeddings.
 * @param {string} status - e.g. 'pending' | 'processing' | 'indexed' | 'failed'
 * @returns {Promise<StudentProfile[]>}
 */
export const findProfilesByEmbeddingStatus = async (status) => {
  return await StudentProfile.find({ embeddingStatus: status });
};

/**
 * Get all profiles that have at least one of the given skills.
 * @param {string[]} skills
 * @returns {Promise<StudentProfile[]>}
 */
export const findProfilesBySkills = async (skills) => {
  return await StudentProfile.find({ skills: { $in: skills } });
};

// ─── Update ───────────────────────────────────────────────────────────────────
/**
 * Update a student profile by the linked userId.
 * @param {string} userId
 * @param {Object} update - Fields to update.
 * @returns {Promise<StudentProfile|null>}
 */
export const updateProfileByUserId = async (userId, update) => {
  return await StudentProfile.findOneAndUpdate(
    { userId },
    { $set: update },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
};

/**
 * Update the embedding status (and optionally lastEmbeddingAt) for a profile.
 * @param {string} userId
 * @param {string} status - 'pending' | 'processing' | 'indexed' | 'failed'
 * @returns {Promise<StudentProfile|null>}
 */
export const updateEmbeddingStatus = async (userId, status) => {
  const update =
    status === 'indexed'
      ? { embeddingStatus: status, lastEmbeddingAt: new Date() }
      : { embeddingStatus: status };

  return await StudentProfile.findOneAndUpdate({ userId }, update, { returnDocument: 'after' });
};

/**
 * Set the resume storage key (S3 / R2 object key) on a profile.
 * @param {string} userId
 * @param {string} resumeStorageKey
 * @returns {Promise<StudentProfile|null>}
 */
export const setResumeStorageKey = async (userId, resumeStorageKey) => {
  return await StudentProfile.findOneAndUpdate(
    { userId },
    { resumeStorageKey, embeddingStatus: 'pending' },
    { returnDocument: 'after' }
  );
};

// ─── Delete ───────────────────────────────────────────────────────────────────
/**
 * Hard-delete a student profile by the linked userId.
 * @param {string} userId
 * @returns {Promise<StudentProfile|null>}
 */
export const deleteProfileByUserId = async (userId) => {
  return await StudentProfile.findOneAndDelete({ userId });
};
