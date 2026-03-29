import { updateEmbeddingStatus } from '../../repositories/index.js';

export const patchEmbeddingStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status)
      return res.status(400).json({ success: false, message: 'userId and status are required' });
    const valid = ['pending', 'processing', 'indexed', 'failed'];
    if (!valid.includes(status))
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${valid.join(', ')}`,
      });

    const updated = await updateEmbeddingStatus(userId, status);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
