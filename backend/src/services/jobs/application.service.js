import JobApplication from '../../models/JobApplication.js';
import JobPosting from '../../models/JobPosting.js';
import Notification from '../../models/Notification.js';
import { sendEmail } from '../../utils/email.js';

export class ApplicationService {
  /**
   * Student applies for a job.
   */
  static async applyToJob(jobId, studentId) {
    const job = await JobPosting.findById(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'active') throw new Error('Job is no longer active');

    // Create application
    const application = await JobApplication.create({ jobId, studentId });

    // Notify the job poster
    await Notification.create({
      userId: job.postedBy,
      jobId: jobId,
      message: `A student has applied for your job: ${job.title}`,
    });

    return application;
  }

  /**
   * List applications for a specific job (Owner only).
   */
  static async getApplicationsForJob(jobId, ownerId) {
    const job = await JobPosting.findOne({ _id: jobId, postedBy: ownerId });
    if (!job) throw new Error('Job not found or unauthorized');

    const applications = await JobApplication.find({ jobId })
      .populate('studentId', 'name email')
      .sort({ appliedAt: -1 });

    return applications;
  }

  /**
   * Update application status.
   */
  static async updateStatus(applicationId, ownerId, status) {
    // Populate both jobId (for title) and studentId (for email)
    const application = await JobApplication.findById(applicationId)
      .populate('jobId')
      .populate('studentId', 'name email');

    if (!application) throw new Error('Application not found');

    if (application.jobId.postedBy.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }

    application.status = status;
    await application.save();

    const isAccepted = status === 'accepted';
    const message = isAccepted
      ? `Your application for "${application.jobId.title}" has been accepted and alumni will contact you when he's free.`
      : `Your application for "${application.jobId.title}" was rejected or not selected.`;

    // 1. Notify the student via dashboard
    await Notification.create({
      userId: application.studentId._id,
      jobId: application.jobId._id,
      message,
    });

    // 2. Notify the student via email (Only if accepted)
    if (isAccepted && application.studentId.email) {
      const studentName = application.studentId.name.split(' ')[0];
      await sendEmail({
        to: application.studentId.email,
        subject: `Application Accepted • ${application.jobId.title}`,
        text: `Congratulations ${studentName}! Your application for "${application.jobId.title}" has been accepted. The recruiter will contact you soon.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #059669;">Congratulations! 🎊</h2>
            <p>Hi ${studentName},</p>
            <p>Great news! Your application for the position <strong>"${application.jobId.title}"</strong> has been <strong>Accepted</strong>.</p>
            <p>The recruiter (Alumni/Professor) will reach out to you shortly for the next steps.</p>
            <p>Best of luck!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">This is an automated notification from SkillSync AI.</p>
          </div>
        `,
      });
    }

    return application;
  }
}
