import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notifications/notification.controller.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);

router.patch('/:id/read', verifyToken, markAsRead);

router.delete('/', verifyToken, clearAllNotifications);

router.delete('/:id', verifyToken, deleteNotification);

export default router;
