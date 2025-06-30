import mongoose from "mongoose";
import { ApiError } from "../utils/AppError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Subscription } from "../models/Subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const getChannelSubscriberCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const count = await Subscription.countDocuments({ channel: channelId });
    return res.json(new ApiResponse(200, { count }, "Fetched subscriber count"));
});

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");

    }

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {

        throw new ApiError(400, "Invalid user ID");
    }

    if (channelId === String(subscriberId)) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existing = await Subscription.findOne({ channel: channelId, subscriber: subscriberId });
    if (existing) {
        await Subscription.deleteOne({ _id: existing._id });
        return res.json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"));
    }


    await Subscription.create({ channel: channelId, subscriber: subscriberId });
    return res.json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"));
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;



    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }


    const subscribers = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberInfo"
            }
        },
        { $unwind: "$subscriberInfo" },
        {
            $project: {
                _id: "$subscriberInfo._id",
                username: "$subscriberInfo.username",
                avatar: "$subscriberInfo.avatar"
            }
        }
    ]);

    return res.json(new ApiResponse(200, subscribers, "Fetched subscribers"));
});

const getUserSubscriptions = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid user ID");
    }



    const channels = await Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo"
            }
        },
        { $unwind: "$channelInfo" },
        {
            $project: {
                _id: "$channelInfo._id",
                username: "$channelInfo.username",
                avatar: "$channelInfo.avatar",
                fullname: "$channelInfo.fullname",

            }
        }
    ]);



    return res.json(new ApiResponse(200, channels, "Fetched subscribed channels"));
});

export {
    toggleSubscription,
    getChannelSubscribers,
    getUserSubscriptions,
    getChannelSubscriberCount
};
