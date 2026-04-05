import JobApplication from '../../models/JobApplication.js';
import JobPosting from '../../models/JobPosting.js';
import Notification from '../../models/Notification.js';

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
    const application = await JobApplication.findById(applicationId).populate('jobId');
    if (!application) throw new Error('Application not found');

    if (application.jobId.postedBy.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }

    application.status = status;
    await application.save();

    const message =
      status === 'accepted'
        ? `Your application for "${application.jobId.title}" has been accepted and alumni will contact you when he's free.`
        : `Your application for "${application.jobId.title}" was rejected or not selected.`;

    // Notify the student
    await Notification.create({
      userId: application.studentId,
      jobId: application.jobId._id,
      message,
    });

    return application;
  }
}
