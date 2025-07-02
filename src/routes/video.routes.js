import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, optionalVerifyJwt } from "../middlewares/auth.middleware.js"
import { getAllVideos, publishAVideo, updateVideo, deleteVideo, togglePublishStatus, getVideoById,getVideoByuser } from "../controllers/video.controller.js";


const router = Router()

router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "video",
                maxCount: 1
            },

            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo
    )

router
    .route("/:videoId")
    .get(optionalVerifyJwt, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/u/:userId")
    .get(getVideoByuser)
    
    

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;

