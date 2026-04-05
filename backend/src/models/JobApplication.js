import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'rejected', 'accepted'],
      default: 'pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student can only apply once to a specific job
jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;
