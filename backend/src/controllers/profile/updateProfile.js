import { updateProfile as updateProfileService } from '../../services/profile/index.js';

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await updateProfileService(userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
