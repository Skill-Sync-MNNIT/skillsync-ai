import express from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { uploadChatImage } from '../middleware/upload.js';

const router = express.Router();

router.use(verifyToken);

router.post('/rooms/1on1', chatController.start1on1Chat);
router.post('/rooms/group', chatController.createGroupChat);
router.get('/rooms', chatController.getMyChatRooms);
router.post('/messages', chatController.sendMessage);
router.get('/messages/:roomId', chatController.getConversationHistory);
router.delete('/rooms/:roomId', chatController.deleteRoom);
router.patch('/rooms/:roomId', chatController.renameGroup);
router.delete('/rooms/:roomId/messages', chatController.clearChatMessages);
router.post('/members/manage', chatController.manageGroupMember);
router.delete('/rooms/:roomId/leave', chatController.leaveGroup);

// Advanced Messaging
router.patch('/messages/:messageId', chatController.editMessage);
router.delete('/messages/:messageId/everyone', chatController.deleteMessageForEveryone);
router.delete('/messages/:messageId/me', chatController.deleteMessageForMe);
router.post('/messages/image', uploadChatImage, chatController.sendImageMessage);

export default router;
