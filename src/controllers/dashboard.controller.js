import mongoose, { Aggregate } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/Subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/AppError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const id = req.user._id;
    const totalVideos = await Video.countDocuments({ owner: id })

    const viewsResult = await Video.aggregate([

        { $match: { owner: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ])

    const totalSubscribers = await Subscription.countDocuments({ channel: id })
    const totalViews = viewsResult[0]?.totalViews || 0;

    const uservideos = await Video.find({ owner: id }, { _id: 1 })
    const videoids = uservideos.map(video => video._id)

    const totalLikes = await Like.countDocuments({ video: { $in: videoids } })

    return res.json(new ApiResponse(200, {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes
    }, "Channel statistics fetched successfully"))


})

const getChannelVideos = asyncHandler(async (req, res) => {
    const id = req.user._id;

    const video = await Video.find({ owner: id }, 'thumbnail title views isPublished createdAt duration')
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Channel videos fetched successfully")
        );
})

export {
    getChannelStats,
    getChannelVideos
}