import { Router } from "express";
import {
    createPosts,
    getUserPosts,
    updatePosts,
    deletePosts
} from "../controllers/posts.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createPosts);
router.route("/user/:userId").get(getUserPosts);
router.route("/:id").patch(verifyJWT, updatePosts).delete(verifyJWT, deletePosts);

export default router;