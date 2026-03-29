import { findProfilesByEmbeddingStatus } from '../../repositories/index.js';
export const getPendingEmbeddings = async (req, res) => {
  try {
    const profiles = await findProfilesByEmbeddingStatus('pending');
    const data = profiles
      .filter((p) => p.resumeStorageKey) // skip users with no resume uploaded
      .map((p) => ({
        userId: p.userId.toString(),
        resumeStorage: p.resumeStorageKey,
        branch: p.branch,
        year: p.year,
        skills: p.skills,
      }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
