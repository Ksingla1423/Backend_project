import { Router } from 'express';
import {
    toggleSubscription,
    getChannelSubscribers,
    getUserSubscriptions,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

// Subscribe - Unsubscribe to a channel
router.post("/:channelId", toggleSubscription);

// List all subscribers of a channel
router.get("/subscribers/:channelId", getChannelSubscribers);

// List all channels that user is subscribed 
router.get("/subscribedto", getUserSubscriptions);

export default router;
