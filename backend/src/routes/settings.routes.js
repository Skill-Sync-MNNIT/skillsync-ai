import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { updatePreferences } from '../controllers/notifications/notification.controller.js';

const router = express.Router();

/**
 * @route   PUT /settings/preferences
 * @desc    Save skillPreferences[] to user record
 */
router.put('/preferences', verifyToken, updatePreferences);

export default router;
