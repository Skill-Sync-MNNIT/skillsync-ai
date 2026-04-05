import { ApplicationService } from '../../services/jobs/application.service.js';

export const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const application = await ApplicationService.applyToJob(jobId, req.user.id);
    res.status(201).json({
      message: 'Successfully applied to the job',
      applicationId: application._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    next(error);
  }
};

export const getApplicationsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const applications = await ApplicationService.getApplicationsForJob(jobId, req.user.id);
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    await ApplicationService.updateStatus(applicationId, req.user.id, status);
    res.status(200).json({ message: `Application status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};
