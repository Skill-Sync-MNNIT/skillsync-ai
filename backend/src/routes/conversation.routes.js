import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import * as convController from '../controllers/conversation/conversation.controller.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', convController.getUserConversations);
router.get('/:id', convController.getConversationById);
router.delete('/:id', convController.deleteConversation);

export default router;
