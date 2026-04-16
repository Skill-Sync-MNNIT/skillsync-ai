import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    connectedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate requests between same pair
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
