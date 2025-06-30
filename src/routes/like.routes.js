import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    togglePostsLike,
} from "../controllers/like.controller.js"
import { VerifyJwt } from '../middlewares/auth.middleware.js';
const router = Router();

router.use(VerifyJwt); 
router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/p/:postsId").post(togglePostsLike);
router.route("/videos").get(getLikedVideos);

export default router