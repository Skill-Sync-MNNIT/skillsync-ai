import { softDeleteProfile as softDeleteService } from '../../services/profile/index.js';

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await softDeleteService(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
