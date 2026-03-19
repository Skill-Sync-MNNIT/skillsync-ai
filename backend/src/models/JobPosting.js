import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    requiredSkills: [
      {
        type: String,
      },
    ],

    deadline: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['pending_moderation', 'active', 'expired', 'rejected', 'withdrawn'],
      default: 'pending_moderation',
    },

    moderationResult: {
      passed: {
        type: Boolean,
      },

      violationType: {
        type: String,
        default: null,
      },

      checkedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

export default JobPosting;
