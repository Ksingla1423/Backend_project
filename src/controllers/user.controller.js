import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import { userModel } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';

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


    const {username,email,password}=req.body; // contains user details from frontend
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
    
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }
console.log("1");

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage= coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : undefined;

console.log("2");

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
            $set:{
                refreshToken: undefined
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



export { registerUser, loginUser, logOutUser, refreshAccessToken };