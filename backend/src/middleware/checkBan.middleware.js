import { BanManager } from '../services/auth/ban.manager.js';

/**
 * Middleware to check if a user is currently banned (temporary or permanent).
 * Should be used AFTER verifyToken.
 */
export const checkBan = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const banStatus = await BanManager.checkActiveBan(req.user.id);

    if (banStatus.status === 'permanent' || banStatus.status === 'temporary') {
      return res.status(403).json({
        message: 'Access Denied: You are currently banned from this action.',
        ban_info: banStatus.message,
        ban_until: banStatus.banUntil || 'Permanent',
      });
    }

    next();
  } catch (error) {
    console.error(`[BAN_CHECK] Error for user ${req.user.id}:`, error.message);
    next(); // Fail-open: allow request if ban check fails (or fail-closed?)
  }
};
