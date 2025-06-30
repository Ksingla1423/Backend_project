import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import { ApiError } from "../utils/AppError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const id = req.user._id

    if (!name) {
        throw new ApiError(400, "Playlist name is  required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: id,
        videos: []
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist created successfully")
        )


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id ")
    }

    const playlist = await Playlist.find({ owner: userId })
        .populate("videos", "title description thumbnail")
        .lean()

    if (!playlist) {
        throw new ApiError(404, "plylist is not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { playlist }, "User playlists fetched successfully")
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            select: "title description thumbnail owner createdAt duration",
            
            populate:{
                path:"owner",
                model:"User",
                select:"username avatar"
            }
        })
        .lean()

    if (!playlist) {
        throw new ApiError(404, "plylist is not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { playlist }, "User playlists fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid plylist id")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")

    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist is not found")
    }

    if (!playlist.videos.includes(videoId)) {

        playlist.videos.push(videoId)
        await playlist.save()
    }
    else {
        throw new ApiError(400, "Video already exists in the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video added to playlist")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid plylist id")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")

    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Video does not exist in the playlist")
    }


    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is not exists in the playlist")
    }

    const playlistvideo = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },//pull is use for remove spicfy array parts 
        { new: true }
    ).populate("videos", "title description thumbnail")

    return res
        .status(200)
        .json(
            new ApiResponse(200, { playlistvideo }, "Video  is successfully  remove from  playlist")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid plylist id")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiError(400, "plylist not found ")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { playlist }, "playlist deleted  successfully ")
        )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid plylist id")
    }

    if (!name && !description) {
        throw new ApiError(400, "Name or description are required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            ...(name && { name }),
            ...(description && { description })

        }, { new: true }
    )

    if (!playlist) {
        throw new ApiError(400, "plylist not found ")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { playlist }, "playlist  updated successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}