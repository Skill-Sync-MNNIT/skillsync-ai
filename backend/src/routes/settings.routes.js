import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { updatePreferences } from '../controllers/notifications/notification.controller.js';
import { deactivateAccount, deleteAccount } from '../controllers/settings/account.controller.js';

const router = express.Router();

router.put('/preferences', verifyToken, updatePreferences);

router.patch('/account/deactivate', verifyToken, deactivateAccount);

router.delete('/account/delete', verifyToken, deleteAccount);

export default router;
