import DownloadLog from '../models/DownloadLog.js';

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Log a resume download event.
 * @param {string} downloaderId   - ObjectId of the user who downloaded the resume.
 * @param {string} resumeOwnerId  - ObjectId of the student whose resume was downloaded.
 * @returns {Promise<DownloadLog>}
 */
export const createDownloadLog = async (downloaderId, resumeOwnerId) => {
  return await DownloadLog.create({ downloaderId, resumeOwnerId });
};
