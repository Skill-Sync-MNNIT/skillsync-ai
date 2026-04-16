import express from 'express';
import * as connectionController from '../controllers/connection.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

router.post('/request', connectionController.sendRequest);
router.get('/requests', connectionController.getMyPendingRequests);
router.patch('/respond', connectionController.respondToRequest);
router.get('/list', connectionController.getMyConnections);
router.get('/status/:targetUserId', connectionController.getConnectionStatus);
router.delete('/:connectionId', connectionController.deleteConnection);
router.get('/pending', connectionController.getMyPendingRequests);

export default router;
