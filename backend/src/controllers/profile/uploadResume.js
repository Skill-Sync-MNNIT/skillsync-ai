import { uploadResume as uploadResumeService } from '../../services/profile/index.js';

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const userId = req.user.id;
    const result = await uploadResumeService(userId, req.file.buffer);
    res.json({ success: true, data: result });
  } catch (error) {
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
    }
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
