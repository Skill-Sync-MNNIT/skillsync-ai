import mongoose from 'mongoose';

const downloadLogSchema = new mongoose.Schema({
  downloaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  resumeOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);

export default DownloadLog;
