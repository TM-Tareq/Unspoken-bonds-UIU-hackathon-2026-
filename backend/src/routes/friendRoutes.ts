import { Router } from 'express';
import { sendFriendRequest, respondToFriendRequest, getFriends, getPendingRequests, getSentRequests, removeFriend } from '../controllers/friendController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/request', sendFriendRequest);
router.post('/respond', respondToFriendRequest);
router.get('/list', getFriends);
router.get('/requests', getPendingRequests);
router.get('/sent', getSentRequests);
router.delete('/:friendId', removeFriend);

export default router;
