import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
    getUserComments
} from "../controllers/comment.controller.js"
import { VerifyJwt } from '../middlewares/auth.middleware.js';
const router = Router();


router
    .route("/:videoId")
    .get(getVideoComments).
    post(VerifyJwt, addComment);

router
    .route("/c/:commentid")
    .delete(VerifyJwt,deleteComment)
    .patch(VerifyJwt, updateComment);

router
    .route("/user/all")
    .get(getUserComments);

export default router