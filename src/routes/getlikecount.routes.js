import { getVideoLikeCount, getPostsLikeCount, getCommentLikeCount } from '../controllers/like.controller.js';
import { Router } from 'express';
const router = Router();


router.get("/video/:videoId", getVideoLikeCount);
router.get("/comment/:commentId", getCommentLikeCount);
router.get("/post/:postsId", getPostsLikeCount);



export default router