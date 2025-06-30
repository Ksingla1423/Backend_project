import { Router } from "express";
import {
    createPosts,
    getUserPosts,
    updatePosts,
    deletePosts
} from "../controllers/posts.controller.js"
import { VerifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(VerifyJwt,createPosts);
router.route("/user/:userId").get(getUserPosts);
router.route("/:id").patch(VerifyJwt,updatePosts).delete(VerifyJwt,deletePosts);    

export default router   