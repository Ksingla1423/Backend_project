import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/AppError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { videoId } = req.params
    const skip = (page - 1) * limit;


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]);


    const totalComments = await Comment.countDocuments({ video: videoId });
    return res
        .status(200)
        .json(
            new ApiResponse(200,
                {
                    totalComments,
                    page,
                    limit,
                    comments
                },
                "All comments fetched")
        )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body



    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found ")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content are required")
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId
    })
    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment added")
        )
})

const updateComment = asyncHandler(async (req, res) => {

    const { commentid } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(commentid)) {
        throw new ApiError(400, "Invalid comment id ")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content are required")
    }
    
    const comment = await Comment.findById(commentid)

    if (!comment) {
        throw new ApiError(404, " comment not found ")
    }


    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentid, {
        $set: {
            content: content
        },
    },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated")
        )

})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentid } = req.params;
    

    if (!mongoose.Types.ObjectId.isValid(commentid)) {
        console.error("Invalid comment ID provided:", commentid);
        throw new ApiError(400, "Invalid comment id ")
    }

    const comment = await Comment.findById(commentid);

    if (!comment) {
        console.error("Comment not found for ID:", commentid);
        throw new ApiError(404, "Comment not found");
    }


    if (comment.owner.toString() !== req.user._id.toString()) {
        console.error("Unauthorized attempt to delete comment. Comment owner:", comment.owner.toString(), "Requesting user:", req.user._id.toString());
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    try {
        await comment.deleteOne();
    } catch (error) {
        throw new ApiError(500, "Failed to delete comment due to a server error");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "comment deleted ")
        )


})

const getUserComments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const comments = await Comment.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1 } }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                video: 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    const totalComments = await Comment.countDocuments({ owner: userId });
    return res.status(200).json(
        new ApiResponse(200, {
            totalComments,
            page,
            limit,
            comments
        }, "User comments fetched")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
    getUserComments
}