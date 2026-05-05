import User from '../../models/User.js';

export class BanManager {
  static async applyViolationPolicy(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let update;
    const now = new Date();

    if (user.violationCount === 0) {
      update = {
        violationCount: 1,
        banUntil: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      };
      console.log(`[BAN] User ${userId} received a 24-hour temporary ban (1st violation).`);
    } else if (user.violationCount === 1) {
      update = {
        violationCount: 2,
        banUntil: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      };
      console.log(
        `[BAN] User ${userId} received an additional 72-hour temporary ban (2nd violation).`
      );
    } else {
      update = {
        violationCount: user.violationCount + 1,
        isBanned: true,
        banUntil: null, // Permanent
      };
      console.log(`[BAN] User ${userId} BANNED PERMANENTLY (3rd+ violation).`);
    }

    await User.findByIdAndUpdate(userId, update);
    return update;
  }

  static async checkActiveBan(userId) {
    const user = await User.findById(userId);
    if (!user) return { status: 'not_found' };

    if (user.isBanned) {
      return { status: 'permanent', message: 'User is permanently banned' };
    }

    if (user.banUntil && user.banUntil > new Date()) {
      const remainingTime = Math.ceil((user.banUntil - new Date()) / (1000 * 60 * 60));
      return {
        status: 'temporary',
        message: `User is temporarily banned for ${remainingTime} more hours`,
        banUntil: user.banUntil,
      };
    }

    return { status: 'active' };
  }
}
