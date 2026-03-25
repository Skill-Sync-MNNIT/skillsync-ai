import { getProfile as getProfileService } from '../../services/profile/index.js';

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await getProfileService(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
