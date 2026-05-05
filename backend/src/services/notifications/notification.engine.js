import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import { sendEmail } from '../../utils/email.js';

export class NotificationEngine {
  /**
   * Trigger notifications for a newly approved job.
   * Finds users whose skillPreferences intersect with the job's requiredSkills.
   */
  static async triggerForNewJob(jobId, jobTitle, requiredSkills) {
    console.log(`[NOTIF_ENGINE] Triggering notifications for job: ${jobId}`);

    try {
      // 1. Find all active students with intersecting skills
      const students = await User.find({
        role: 'student',
        isActive: true,
        skillPreferences: { $in: requiredSkills },
      }).select('_id name email');

      if (students.length === 0) {
        console.log('[NOTIF_ENGINE] No matching students found.');
        return;
      }

      // 2. Prepare batch notifications for the dashboard
      const notifications = students.map((student) => ({
        userId: student._id,
        jobId,
        message: `New Job Match: "${jobTitle}" matches your skill preferences!`,
      }));

      // 3. Batch insert dashboard notifications
      await Notification.insertMany(notifications, { ordered: false });

      // 4. Send emails to matched students
      const emailPromises = students.map((student) => {
        const firstName = student.name.split(' ')[0];
        return sendEmail({
          to: student.email,
          subject: `Job Match Recommendation • ${jobTitle}`,
          text: `Hi ${firstName}, a new job posting "${jobTitle}" matches your skill preferences! Check it out on SkillSync.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>New Job Match! 🚀</h2>
              <p>Hi ${firstName},</p>
              <p>A new job posting <strong>"${jobTitle}"</strong> has been approved that matches your skill preferences.</p>
              <p>Don't miss out on this opportunity!</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs/${jobId}" 
                 style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
                 View Job Details
              </a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                You received this because it matches your skill preferences on SkillSync.
              </p>
            </div>
          `,
        });
      });

      await Promise.allSettled(emailPromises);
      console.log(
        `[NOTIF_ENGINE] Successfully triggered ${notifications.length} notifications and emails.`
      );
    } catch (error) {
      console.error('[NOTIF_ENGINE] Error triggering notifications:', error.message);
    }
  }

  // Trigger notifications when a group is discarded by an admin.

  static async triggerForGroupDiscard(room) {
    console.log(`[NOTIF_ENGINE] Triggering discard notifications for group: ${room._id}`);
    try {
      // 1. Prepare notifications for all participants except the admin
      const participantsToNotify = room.participants.filter((p) => {
        const pid = typeof p === 'object' ? p._id : p;
        return String(pid) !== String(room.admins[0]?._id || room.admins[0]);
      });

      if (participantsToNotify.length === 0) return;

      const notifications = participantsToNotify.map((participant) => ({
        userId: typeof participant === 'object' ? participant._id : participant,
        message: `The group "${room.name || 'Conversation'}" has been discarded by the admin.`,
      }));

      // 2. Insert notifications
      await Notification.insertMany(notifications, { ordered: false });
      console.log(
        `[NOTIF_ENGINE] Group discard notifications sent to ${notifications.length} members.`
      );
    } catch (error) {
      console.error('[NOTIF_ENGINE] Error triggering discard notifications:', error.message);
    }
  }
}
