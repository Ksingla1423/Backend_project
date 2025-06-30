import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import { VerifyJwt } from '../middlewares/auth.middleware.js';

const router = Router()

router.use( VerifyJwt)

router.route("/stats").get(getChannelStats)
router.route("/videos").get(getChannelVideos)

export default router