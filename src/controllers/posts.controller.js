
import mongoose, { isValidObjectId } from "mongoose"
import { Posts } from "../models/posts.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/AppError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPosts = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const posts = await Posts.create({
        content: content,
        owner: req.user._id
    })
    return res
        .status(200).json(
            new ApiResponse(200, posts, "post is successfully")
        )
})

import { Like } from "../models/like.model.js";

const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(404, "Invalid user ID");
    }

    const posts = await Posts.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
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
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                isLiked: {
                    $cond: {
                        if: req.user,
                        then: {
                            $in: [
                                new mongoose.Types.ObjectId(req.user?._id),
                                "$likes",
                            ],
                        },
                        else: false,
                    },
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "No posts found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "Posts found successfully"));
});



const updatePosts = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(404, "invalid post id ")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Post content are required")
    }

    const posts = await Posts.findByIdAndUpdate(

        id,
        {
            content: content
        }
    )

    if (!posts) {
        throw new ApiError(404, " post is not found ")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, posts, "Post are successfully updated")
        )

})

const deletePosts = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(404, "invalid post id ")
    }
    const deletePosts = await Posts.findByIdAndDelete(id)
    if (!deletePosts) {
        throw new ApiError(404, "Post not found");
    }
   
    return res
        .status(200)
        .json(
            new ApiResponse(200, deletePosts, "Post are successfully delete ")
        )
})


export {
    createPosts,
    getUserPosts,
    updatePosts,
    deletePosts
}