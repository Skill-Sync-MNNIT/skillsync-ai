import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    course: {
      type: String,
      default: 'B.Tech',
    },

    branch: {
      type: String,
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'NA'],
      default: 'CSE',
    },

    year: {
      type: Number,
      min: 1,
      max: 4,
    },

    cpi: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
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
