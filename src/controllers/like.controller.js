import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/AppError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import path from "path"




const getVideoLikeCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const likeCount = await Like.countDocuments({ video: videoId });
    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Fetched like count of videos successfully"));
});

const getCommentLikeCount = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const likeCount = await Like.countDocuments({ comment: commentId });
    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Fetched like count of Comment successfully"));
});

const getPostsLikeCount = asyncHandler(async (req, res) => {
    const { postsId } = req.params

    if (!mongoose.Types.ObjectId.isValid(postsId)) {
        throw new ApiError(400, "Invalid post id");
    }

    const likeCount = await Like.find({ posts: postsId }).countDocuments();
    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Fetched like count of post successfully"));
});

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }


    const alreadyLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    })

    if (alreadyLiked) {
        await Like.deleteOne({ _id: alreadyLiked._id });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unliked successfully"))
    }

    const newLikeEntry = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })


    return res
        .status(200)
        .json(
            new ApiResponse(200, { newLike: true }, "Liked successfully")
        )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const alreadyLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id,
    });

    if (alreadyLiked) {
        await Like.deleteOne({ _id: alreadyLiked._id });
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Unliked successfully"));
    }

    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id,
    });


    return res
        .status(200)
        .json(
            new ApiResponse(200, { newLike }, "Liked successfully")
        );
});


const togglePostsLike = asyncHandler(async (req, res) => {
    const { postsId } = req.params

    if (!mongoose.Types.ObjectId.isValid(postsId)) {
        throw new ApiError(400, "Invalid post id");
    }
    const alreadyLiked = await Like.findOne({
        posts: postsId,
        likedBy: req.user._id,
    })

    if (alreadyLiked) {
        await Like.deleteOne({ _id: alreadyLiked._id });
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Unliked successfully"))
    }

    const newLike = await Like.create({
        posts: postsId,
        likedBy: req.user._id
    })


    return res
        .status(200)
        .json(
            new ApiResponse(200, { newLike }, " successfully")
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.find({
        likedBy: req.user.id,
        video: { $exists: true }
    }).populate({
        path: "video",
        select:"-VideoFile -description",
        populate:{
           path:"owner",
                       select: "-password -email -fullname -coverImage -refreshToken -watchHistory -createdAt -updatedAt" 
        }

    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "got all liked videos successfully")
        )
})

export {
    toggleCommentLike,
    togglePostsLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikeCount,
    getCommentLikeCount,
    getPostsLikeCount,
}