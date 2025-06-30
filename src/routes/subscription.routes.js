import { Router } from 'express';
import {
    toggleSubscription,
    getChannelSubscribers,
    getUserSubscriptions,
} from "../controllers/subscription.controller.js";
import { VerifyJwt } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(VerifyJwt);

// Subscribe - Unsubscribe to a channel
router.post("/:channelId", toggleSubscription);

// List all subscribers of a channel
router.get("/subscribers/:channelId", getChannelSubscribers);

// List all channels that user is subscribed 
router.get("/subscribedto", getUserSubscriptions);

export default router;
