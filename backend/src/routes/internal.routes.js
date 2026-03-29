import express from 'express';
import { verifyInternalSecret } from '../middleware/verifyInternalSecret.js';
import { getPendingEmbeddings } from '../controllers/internal/pendingEmbeddings.js';
import { patchEmbeddingStatus } from '../controllers/internal/updateEmbeddingStatus.js';

const router = express.Router();

router.use(verifyInternalSecret);

router.get('/pending-embeddings', getPendingEmbeddings);
router.patch('/embedding-status', patchEmbeddingStatus);

export default router;
