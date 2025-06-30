import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/AppError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary, publicId, generateVideoThumbnail } from "../utils/cloudinaryvideo.js"
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

const timeAgo = (date) => dayjs(date).fromNow();



const getAllVideos = asyncHandler(async (req, res) => {
    const {
        query,
        sortBy = ["views", "createdAt"],
        sortType = "desc",
        userId,
        minViews,
        maxViews,
        minDuration,
        maxDuration,
        fromDate,
        toDate,
    } = req.query;

    const matchStage = { isPublished: true };
    const sortDir = sortType === "asc" ? 1 : -1;

    if (query?.trim()) {
        matchStage.$text = { $search: query.trim() };
    }

    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    //$gte stands for "greater than or equal to ".

    if (minViews) {
        matchStage.views = { ...(matchStage.views || {}), $gte: Number(minViews) }
    }

    // $lte  Less Than or Equal To

    if (maxViews) {
        matchStage.views = { ...(matchStage.views || {}), $lte: Number(maxViews) }
    }

    if (minDuration) {
        matchStage.duration = { ...(matchStage.duration || {}), $gte: Number(minDuration) }
    }

    if (maxDuration) {
        matchStage.duration = { ...(matchStage.duration || {}), $lte: Number(maxDuration) }
    }


    if (fromDate) {
        matchStage.createdAt = {
            ...(matchStage.createdAt || {}),
            $gte: new Date(fromDate)
        };
    }

    if (toDate) {
        matchStage.createdAt = {
            ...(matchStage.createdAt || {}),
            $lte: new Date(toDate)
        };
    }

    const sortStage = {};
    if (Array.isArray(sortBy)) {
        for (const field of sortBy) {
            sortStage[field] = sortDir;
        }
    } else {
        sortStage[sortBy] = sortDir;
    }
    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        { $unwind: "$owner" },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                description: 1,
                "owner.username": 1,
                "owner.avatar": 1,
            },
        },
        { $sort: sortStage },

    ];

    const videos = await Video.aggregate(pipeline);


    return res
        .status(200)
        .json(
            new ApiResponse(200, { videos }, "All videos fetched successfully")
        );
});


const publishAVideo = asyncHandler(async (req, res) => {
    let { title, description } = req.body

    const Videofile = req.files?.video?.[0]
    const videoPath = Videofile?.path
    const originalName = Videofile?.originalname


    if (!title || title.trim() === "") {

        if (originalName && originalName.includes(".")) {
            const dotIndex = originalName.lastIndexOf(".");
            title = originalName.slice(0, dotIndex).trim();

        } else {

            const dataobj = new Date()
            const day = dataobj.getDate()
            const month = dataobj.getMonth()
            const year = dataobj.getFullYear()

            title = `${day} - ${month} - ${year}`
        }
    }

    const videoFilePath = req.files?.video?.[0]?.path
    const thumbnailFilePath = req.files?.thumbnail?.[0]?.path

    if (!videoPath) {
        throw new ApiError(400, "A video file is required");
    }

    if (!videoFilePath) {
        throw new ApiError(400, "video  are required ")
    }

    try {
        const video = await uploadOnCloudinary(videoFilePath, "video")


        if (!video?.url) {
            throw new ApiError(500, "video  upload failed ")
        }

        let thumbnailUrl = null

        if (thumbnailFilePath) {
            const uploadedThumbnail = await uploadOnCloudinary(thumbnailFilePath)
            if (!uploadedThumbnail?.secure_url) {
                throw new ApiError(500, "Thumbnail upload failed");
            }
            thumbnailUrl = uploadedThumbnail.secure_url;

        }
        else {
            const vidPublicId = video.public_id;
            thumbnailUrl = generateVideoThumbnail(vidPublicId)

        }

        const duration = video?.duration ? Math.floor(video.duration) : 0

        const newVideo = await Video.create({
            title,
            description,
            owner: req.user._id,
            VideoFile: video.url,
            thumbnail: thumbnailUrl,
            duration: duration,
            isPublished: true

        })
        return res.status(201).json(
            new ApiResponse(201, newVideo, "Video uploaded successfully")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Internal Server Error");

    }
})

const getVideoByuser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .select("title thumbnail views duration createdAt");

    const total = await Video.countDocuments({ owner: userId });

    return res.status(200).json(
        new ApiResponse(200, { videos, total }, "Videos by user fetched successfully")
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id;


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Invalid video ID");
    }

    await Promise.all([
        Video.updateOne({ _id: videoId }, { $inc: { views: 1 } }),
        (async () => {
            if (userId) {
                const user = await User.findById(userId);
                if (user) {
                    user.watchHistory = user.watchHistory.filter(id => id.toString() !== videoId);
                    user.watchHistory.unshift(videoId);
                    if (user.watchHistory.length > 50) user.watchHistory.pop();
                    await user.save();
                }
            }
        })(),
    ]);

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (req.user && req.user._id) {
        const user = await User.findById(req.user._id);

        if (user) {
            user.watchHistory = user.watchHistory.filter(
                (id) => id.toString() !== videoId
            );
            user.watchHistory.unshift(videoId);

            if (user.watchHistory.length > 40) {
                user.watchHistory = user.watchHistory.slice(0, 50);
            }

            await user.save();
        }
    }

    await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } });

    const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            foreignField: "channel",
                            localField: "_id",
                            as: "subscribers",
                        },
                    },
                    {
                        $addFields: {
                            subscribers: "$subscribers.subscriber",
                        },
                    },
                    {
                        $addFields: {
                            subscriberCount: { $size: "$subscribers" },
                            isSubscribed: userId
                                ? {
                                    $cond: {
                                        if: {
                                            $in: [new mongoose.Types.ObjectId(userId), "$subscribers"]
                                        },
                                        then: true,
                                        else: false
                                    }
                                }
                                : false
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            createdAt: 1,
                            subscriberCount: 1,
                            isSubscribed: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$owner" },

        {
            $lookup: {
                from: "likes",
                let: { videoId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$video", "$$videoId"]
                            }
                        }
                    }
                ],
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                isLiked: userId ? {
                    $in: [new mongoose.Types.ObjectId(userId), "$likes.likedBy"]
                } : false
            }
        },

        {
            $project: {
                title: 1,
                description: 1,
                VideoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                owner: 1,
                likeCount: 1,
                isLiked: 1
            },
        },
    ];



    const result = await Video.aggregate(pipeline);

    if (!result || result.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    let watchHistoryIds = [];
    if (userId) {
        const user = await User.findById(userId).select("watchHistory");
        watchHistoryIds = user?.watchHistory.map(id => id.toString()) || [];
    }

    const videoData = {
        ...result[0],
        timeAgo: timeAgo(result[0].createdAt),
    };

    res.status(200).json(new ApiResponse(200,
        { videoData, watchHistory: watchHistoryIds },
        "Video found successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const title = req.body?.title
    const description = req.body?.description
    const thumbnailLocalPath = req.file?.path;


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) is required for update");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    let uploadedThumbnail;


    if (thumbnailLocalPath) {
        const thumbPublicId = publicId(video.thumbnail);
        const isRealThumbnail = video.thumbnail?.includes("res.cloudinary.com") &&
            thumbPublicId &&
            video.thumbnail.includes("/image/upload/");

        if (isRealThumbnail) {
            await deleteFromCloudinary(thumbPublicId, "image");
        }

        uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");
        if (!uploadedThumbnail?.secure_url) {
            throw new ApiError(500, "Error uploading new thumbnail");
        }
    }
    const updatedFields = {}
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (uploadedThumbnail) {
        updatedFields.thumbnail = uploadedThumbnail.secure_url;
    }

    const response = await Video.findByIdAndUpdate(
        videoId,
        { $set: updatedFields },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, response, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    if (video.thumbnail) {
        const thumbPublicId = publicId(video.thumbnail)

        const isRealThumbnail =
            video.thumbnail.includes("res.cloudinary.com") &&
            thumbPublicId &&
            video.thumbnail.includes("/image/upload/")

        if (isRealThumbnail) {
            await deleteFromCloudinary(publicId(video.thumbnail), "image");
        }

    }
    await deleteFromCloudinary(publicId(video.VideoFile), "video");



    await Video.findByIdAndDelete(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200,
                "video is deleted successfully"
            )
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    video.isPublished = !video.isPublished;
    await video.save()

    res.status(200)
        .json(
            new ApiResponse(200, `Video is now ${video.isPublished ? "Published" : "Unpublished"}`,
                { isPublished: video.isPublished, }
            )
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoByuser,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}