import { Router } from 'express';
import { getModules, getProgress, completeLesson } from '../controllers/learnController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/modules', getModules);
router.get('/progress', getProgress);
router.post('/complete', completeLesson);

export default router;
