import User from '../../models/User.js';
import Notification from '../../models/Notification.js';

export class NotificationEngine {
  /**
   * Trigger notifications for a newly approved job.
   * Finds users whose skillPreferences intersect with the job's requiredSkills.
   */
  static async triggerForNewJob(jobId, jobTitle, requiredSkills) {
    console.log(`[NOTIF_ENGINE] Triggering notifications for job: ${jobId}`);

    try {
      // 1. Find all active users with intersecting skills
      const users = await User.find({
        role: 'student',
        isActive: true,
        skillPreferences: { $in: requiredSkills },
      }).select('_id');

      if (users.length === 0) {
        console.log('[NOTIF_ENGINE] No matching users found.');
        return;
      }

      // 2. Prepare batch notifications
      const notifications = users.map((user) => ({
        userId: user._id,
        jobId,
        message: `New Job Match: "${jobTitle}" matches your skill preferences!`,
      }));

      // 3. Batch insert
      await Notification.insertMany(notifications, { ordered: false });
      console.log(`[NOTIF_ENGINE] Successfully sent ${notifications.length} notifications.`);
    } catch (error) {
      console.error('[NOTIF_ENGINE] Error triggering notifications:', error.message);
    }
  }
}
