import { getResumeUrl as getResumeUrlService } from '../../services/profile/index.js';

export const getResumeUrl = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { userId } = req.params;
    const result = await getResumeUrlService(requesterId, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
