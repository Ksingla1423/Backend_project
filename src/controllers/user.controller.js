import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import { userModel } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose, { set } from 'mongoose';

const generateTokens=async (userId)=>{
    try {
        const user= await userModel.findById(userId)
        const accessT= user.generateAccessToken();
        const refreshT= user.generateRefreshToken();
        user.refreshToken=refreshT;
        await user.save({validateBeforeSave: false}); // we are not validating the user again as we have already validated it while creating the user
        return {accessT,refreshT}
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    }
} 

const registerUser= asyncHandler(async (req,res)=>{
    // user details lenge from frontend(postman)
    // validation of deatils correct 
    // check if user already exists: username,email
    // check for files 
    // upload them to cloudinary,avatar
    // db mein store krenge
    // -->create user object--- creation entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response to frontend else error


    const {username,email,password,fullname}=req.body; // contains user details from frontend
    // Example: { username: 'john_doe', email: '}

    // console.log("email :",email);
 if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser=await userModel.findOne({$or:[{username},{email}]})

    if(existedUser){
        throw new ApiError(409,"User already exists with this username or email")
    }

// we have used multer as a middle ware which gives additional methold .files for req we are then checking optionally ternary perator if file exist and if avatar first property exist which returns a object and if we do .path we can get the path that multer used

    
    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // console.log(avatarLocalPath===undefined);
    
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }
console.log("1");

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage= coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : undefined;

// console.log(coverImage);

    if(!avatar){
        throw new ApiError(400,"Avatar upload failed");
    }
console.log("3");


    const user=await userModel.create({
        fullname,
        username:username.toLowerCase(),
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,

    })
console.log("4");

    const createdUser= await userModel.findById(user._id).select(
        "-password -refreshToken"
    )

// console.log(req.files);`

    if(!createdUser){
        throw new ApiError(500,"User creation failed");
    }


    return res.status(201).json(
        new ApiResponse(201, createdUser ,"user registered succesfully",)
    )
  // res.json();
    
})


const loginUser= asyncHandler(async(req,res)=>{
    // TODOS
    // 1-> get user details from frontend 
    // 2-> validate user details 
    // 3-> if user exisist tehn something else display a message signup first
    // 4-> check for password
    // 5-> if coorect password provide access token
    // 6-> if not correct password then throw error
    // 7-> return response to frontend with user details and access token and refresh token
    // 8-> send cookie

    const {username,email,password}= req.body;

    if(!username && !email){
        throw new ApiError(400, "Username and email are required")
    }

    const user=await userModel.findOne({$or:[{username},{email}]})


    if(!user){
        throw new ApiError(404, "User not found, please signup first")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    const {accessT,refreshT}=await generateTokens(user._id);


    const loggedInUser= await userModel.findById(user._id).select( " -password -refreshToken")


    const options={
        httpOnly:true,
        secure:true
    }



    return res
    .status(200)
    .cookie("accessToken", accessT, options)
    .cookie("refreshToken",refreshT,options)
    .json(
        new ApiResponse(200,{
            user: loggedInUser,
            accessToken: accessT,
            refreshToken: refreshT
        }, "User logged in successfully" )
    )

})


const logOutUser= asyncHandler(async (req, res) => {
    // 1-> get user from req
    // 2-> remove refresh token from user
    // 3-> save user
    // 4-> clear cookies
    // 5-> return response to frontend

    const user = req.user;

    await userModel.findByIdAndUpdate(
        user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )


    const options={
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, null, "User logged out successfully")
    )
}); 


const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookie.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required");
    }


    try {
        const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user=await userModel.findById(decodedToken._id)
    
    
        if(!user || user.refreshToken !== incomingRefreshToken){
            throw new ApiError(404,"Invalid refresh token");
        }
    
    
        const options={
            httpOnly:true,
            secure:true
        }
    
    
        const {accessT,refreshT}=await generateTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken",accessT,options)
        .cookie("refreshToken",refreshT,options)
        .json(
            new ApiResponse(200, {
                accessToken: accessT,
                refreshToken: refreshT
            }, "Access token refreshed successfully")
        )
    
    } catch (error) {
        throw new ApiError(401, error?.message ||"Invalid refresh token");
    }

})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword , confirmPassword} = req.body;

    if(!oldPassword || !newPassword || !confirmPassword){
        throw new ApiError(400, "All fields are required");
    }

    if(newPassword !== confirmPassword){
        throw new ApiError(400, "New password and confirm password do not match");
    }
    
    if(oldPassword === newPassword){
        throw new ApiError(400, "New password cannot be same as old password");
    }

    const user =await userModel.findById(req.user?._id);

    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(
        new ApiResponse(200,null, "Password changed successfully")
    );
})


const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(200, req.user, "Current user fetched successfully");
})

const updateDetails= asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;

    if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required");
    }

    const user=await userModel.findById(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "User details updated successfully")
    );
})


const updateUserAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }


    const avatar= await uploadOnCloudinary(avatarLocalPath);

    if(avatar.url) {
        throw new ApiError(400, "Error uploading avatar");
    }

    const user = await userModel.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password ");

    return res.status(200).json(
        new ApiResponse(200, user, "User avatar updated successfully")
    )


})


const updateUserCoverImage = asyncHandler(async(req,res)=>{

    const coverLocalPath=req.file?.path
    if(!coverLocalPath){
        throw new ApiError(400, "Cover image is required");
    }


    const cover= await uploadOnCloudinary(coverLocalPath);

    if(cover.url) {
        throw new ApiError(400, "Error uploading cover image");
    }

    const user = await userModel.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                cover: cover.url
            }
        },
        {
            new: true
        }
    ).select("-password ");

    return res.status(200).json(
        new ApiResponse(200, user, "User cover image updated successfully")
    )


});

// aggregation piplines
const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username}=req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Username is required");
    }

    const channel= await userModel.aggregate([
        {
            $match:{
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size : "$subscribers"
                },
                subscribedToCount:{
                    $size : "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {
                            $in: [req.user?._id,"$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
            fullname:1,
            username:1,
            email:1,
            avatar:1,
            coverImage:1,
            subscriberCount:1,
            subscribedToCount:1,
            isSubscribed:1
        }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel not found");
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    )

})

const watchHistory = asyncHandler(async(req,res)=>{

    const user=await userModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup :{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )

})




export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateDetails, updateUserAvatar , updateUserCoverImage , getUserChannelProfile , watchHistory};