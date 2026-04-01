import User from '../../models/User.js';

export class BanManager {
  /**
   * Apply the university's violation policy to a user.
   * 1st violation: 3-day temporary ban.
   * 2nd violation+: Permanent ban.
   */
  static async applyViolationPolicy(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let update;
    const now = new Date();

    if (user.violationCount === 0) {
      // First violation: 3 day ban
      update = {
        violationCount: 1,
        banUntil: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      };
      console.log(`[BAN] User ${userId} received a 3-day temporary ban (1st violation).`);
    } else {
      // Second or further violation: Permanent ban
      update = {
        violationCount: user.violationCount + 1,
        isBanned: true,
        banUntil: null, // Permanent
      };
      console.log(`[BAN] User ${userId} BANNED PERMANENTLY (2nd+ violation).`);
    }

    await User.findByIdAndUpdate(userId, update);
    return update;
  }

  /**
   * Check if a user currently has an active ban.
   * Both permanent (isBanned) and temporary (banUntil > now) are checked.
   */
  static async checkActiveBan(userId) {
    const user = await User.findById(userId);
    if (!user) return { status: 'not_found' };

    if (user.isBanned) {
      return { status: 'permanent', message: 'User is permanently banned' };
    }

    if (user.banUntil && user.banUntil > new Date()) {
      const remainingTime = Math.ceil((user.banUntil - new Date()) / (1000 * 60 * 60)); // hours
      return {
        status: 'temporary',
        message: `User is temporarily banned for ${remainingTime} more hours`,
        banUntil: user.banUntil,
      };
    }

    return { status: 'active' };
  }
}
