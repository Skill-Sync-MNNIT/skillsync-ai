import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  getNotifications,
  markAsRead,
} from '../controllers/notifications/notification.controller.js';

const router = express.Router();

/**
 * @route   GET /notifications
 * @desc    Fetch all notifications for logged-in user
 */
router.get('/', verifyToken, getNotifications);

/**
 * @route   PATCH /notifications/:id/read
 * @desc    Mark a single notification as read
 */
router.patch('/:id/read', verifyToken, markAsRead);

export default router;
