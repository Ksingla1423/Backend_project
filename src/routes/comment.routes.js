import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
    getUserComments
} from "../controllers/comment.controller.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();


router
    .route("/:videoId")
    .get(getVideoComments).
    post(verifyJWT, addComment);

router
    .route("/c/:commentid")
    .delete(verifyJWT, deleteComment)
    .patch(verifyJWT, updateComment);

router
    .route("/user/all")
    .get(getUserComments);

export default router