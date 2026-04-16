import express from 'express';
import * as projectController from '../controllers/project.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', projectController.postProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getSingleProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
