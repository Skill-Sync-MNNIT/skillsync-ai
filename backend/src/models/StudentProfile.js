import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    branch: {
      type: String,
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT'],
    },

    year: {
      type: Number,
      min: 1,
      max: 4,
    },

    skills: [
      {
        type: String,
      },
    ],

    resumeStorageKey: {
      type: String,
    },

    embeddingStatus: {
      type: String,
      enum: ['pending', 'processing', 'indexed', 'failed'],
      default: 'pending',
    },

    lastEmbeddingAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile;
