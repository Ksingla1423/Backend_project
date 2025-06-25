import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import { userModel } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/apiResponse.js';

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
    
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage= coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : undefined;


    if(!avatar){
        throw new ApiError(400,"Avatar upload failed");
    }


    const user=await userModel.create({
        fullname,
        username:username.toLowerCase(),
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,

    })

    const createdUser= await userModel.findById(user._id).select(
        "-password -refreshToken"
    )

// console.log(req.files);

    if(!createdUser){
        throw new ApiError(500,"User creation failed");
    }


    return res.status(201).json(
        new ApiResponse(201, createdUser ,"user registered succesfully",)
    )




    // res.json();
    
})

export { registerUser };