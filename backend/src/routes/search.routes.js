import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { searchController } from '../controllers/search/search.controller.js';

const router = express.Router();

router.post('/', verifyToken, searchController);

export default router;
