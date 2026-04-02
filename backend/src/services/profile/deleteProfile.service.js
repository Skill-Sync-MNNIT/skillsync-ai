import { updateUserById, updateEmbeddingStatus } from '../../repositories/index.js';

// DELETE /profile
export const softDeleteProfile = async (userId) => {
  // Set User.isActive to false
  const user = await updateUserById(userId, { isActive: false });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  // Update embedding status to failed
  await updateEmbeddingStatus(userId, 'failed');

  // Call Python AI service to remove from vector index
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    await fetch(`${aiServiceUrl}/embed/${userId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('AI service delete call failed:', err.message);
  }

  return { message: 'Profile deactivated successfully' };
};
