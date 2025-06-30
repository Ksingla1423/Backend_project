import { Router } from 'express';
import { getChannelSubscriberCount } from '../controllers/subscription.controller.js';
const router = Router();


router.get('/:channelId', getChannelSubscriberCount);



export default router;

