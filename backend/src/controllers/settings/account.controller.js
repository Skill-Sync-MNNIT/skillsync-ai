import User from '../../models/User.js';
import StudentProfile from '../../models/StudentProfile.js';
import JobPosting from '../../models/JobPosting.js';
import JobApplication from '../../models/JobApplication.js';
import Notification from '../../models/Notification.js';
import DownloadLog from '../../models/DownloadLog.js';
import Project from '../../models/Project.js';
import Connection from '../../models/Connection.js';
import cloudinary from '../../config/cloudinary.js';
import { updateEmbeddingStatus } from '../../repositories/index.js';

const cleanAIIndex = async (userId) => {
  try {
    // 1. Mark status as failed in Mongo (hides it from search)
    await updateEmbeddingStatus(userId, 'failed');

    // 2. Call Python AI service to remove from vector index
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    await fetch(`${aiServiceUrl}/embed/${userId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[AI_CLEANUP] AI service delete call failed:', err.message);
  }
};

export const deactivateAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Database Update
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. AI Index Cleanup
    await cleanAIIndex(userId);

    res
      .status(200)
      .json({ message: 'Account deactivated successfully. You have been logged out.' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ─── AI Index Cleanup (BEFORE Data Purge) ──────────────────
    await cleanAIIndex(userId);

    // 1. Find the user first to verify and get info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    //Cleanup Student-specific data (including Cloudinary)
    const profile = await StudentProfile.findOne({ userId });
    if (profile && profile.resumeStorageKey) {
      try {
        await cloudinary.uploader.destroy(profile.resumeStorageKey);
      } catch (cloudErr) {
        console.error('Failed to delete resume from Cloudinary during account deletion:', cloudErr);
      }
    }

    const myJobs = await JobPosting.find({ postedBy: userId });
    const myJobIds = myJobs.map((job) => job._id);

    if (myJobIds.length > 0) {
      await JobApplication.deleteMany({ jobId: { $in: myJobIds } });
      await JobPosting.deleteMany({ postedBy: userId });
    }

    await JobApplication.deleteMany({ studentId: userId });
    await StudentProfile.deleteOne({ userId });
    await Notification.deleteMany({ userId });
    await DownloadLog.deleteMany({
      $or: [{ downloaderId: userId }, { resumeOwnerId: userId }],
    });

    // Delete all projects the user owns (they cannot be shown without an owner)
    await Project.deleteMany({ owner: userId });

    // Remove the user from the participants list of any project they had joined
    await Project.updateMany({ participants: userId }, { $pull: { participants: userId } });

    // Remove all connection records involving this user (both sent and received)
    // This removes them from every other student's connection list
    await Connection.deleteMany({
      $or: [{ requester: userId }, { recipient: userId }],
    });

    //Finally, delete the User record
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};
