import { Router } from 'express';
import { createConversation, getConversations, getMessages, searchUsers, searchAllUsers } from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/create', createConversation);
router.get('/list', getConversations);
router.get('/:conversationId/messages', getMessages);
router.get('/users/search', searchUsers);
router.get('/users/all', searchAllUsers);

export default router;
