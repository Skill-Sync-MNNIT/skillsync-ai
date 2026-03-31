import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      default: null,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['student', 'professor', 'alumni'],
      default: 'student',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    banUntil: {
      type: Date,
      default: null,
    },

    violationCount: {
      type: Number,
      default: 0,
    },

    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
