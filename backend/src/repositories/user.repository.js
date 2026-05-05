import User from '../models/User.js';

// ─── Create ───────────────────────────────────────────────────────────────────
/**
 * Create a new user document.
 * @param {Object} data - Fields to set on the new User.
 * @returns {Promise<User>}
 */
export const createUser = async (data) => {
  return await User.create(data);
};

// ─── Read ─────────────────────────────────────────────────────────────────────
/**
 * Find a user by their email address (case-sensitive).
 * @param {string} email
 * @returns {Promise<User|null>}
 */
export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

/**
 * Find a user by their email prefix (e.g., "yugank.2024ca116" matches "yugank.2024ca116@mnnit.ac.in").
 * @param {string} prefix
 * @returns {Promise<User|null>}
 */
export const findUserByEmailPrefix = async (prefix) => {
  return await User.findOne({ email: { $regex: new RegExp(`^${prefix}@`, 'i') } });
};

/**
 * Find a user by their MongoDB ObjectId.
 * @param {string} id
 * @returns {Promise<User|null>}
 */
export const findUserById = async (id) => {
  return await User.findById(id);
};

/**
 * Find a user by their stored refresh token.
 * @param {string} token
 * @returns {Promise<User|null>}
 */
export const findUserByRefreshToken = async (token) => {
  return await User.findOne({ refreshToken: token });
};

// ─── Update ───────────────────────────────────────────────────────────────────=
/**
 * Update a user document by id and return the updated doc.
 * @param {string} id
 * @param {Object} update - Fields to update.
 * @returns {Promise<User|null>}
 */
export const updateUserById = async (id, update) => {
  return await User.findByIdAndUpdate(id, update, { returnDocument: 'after' });
};

/**
 * Store (or clear) a refresh token on the user document.
 * @param {string} id
 * @param {string|null} token - Pass null to clear.
 * @returns {Promise<User|null>}
 */
export const updateRefreshToken = async (id, token) => {
  return await User.findByIdAndUpdate(id, { refreshToken: token }, { returnDocument: 'after' });
};

/**
 * Update user online status and last seen time.
 * @param {string} id
 * @param {boolean} isOnline
 */
export const updateOnlineStatus = async (id, isOnline) => {
  const update = { isOnline };
  if (!isOnline) {
    update.lastSeen = Date.now();
  }
  return await User.findByIdAndUpdate(id, update, { returnDocument: 'after' });
};

// ─── Delete ───────────────────────────────────────────────────────────────────
/**
 * Hard-delete a user by id.
 * @param {string} id
 * @returns {Promise<User|null>}
 */
export const deleteUserById = async (id) => {
  return await User.findByIdAndDelete(id);
};
