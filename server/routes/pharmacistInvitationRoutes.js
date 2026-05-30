import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateInvitation } from '../controllers/pharmacistInvitationController.js';

const router = express.Router();

router.post('/generate', protect, generateInvitation);

export default router;
