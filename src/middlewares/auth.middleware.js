import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";

export const verifyJWT= asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!accessToken){
            throw new ApiError(401,"Unauthorised request");
        }
    
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
        const user=await userModel.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(404, "Invalid Access Token");
        }
    
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Unauthorised request");
    }

})


export const optionalVerifyJwt = asyncHandler(async (req, _, next) => {
  const raw = req.cookies.accessToken || req.header("Authorization")
  if (!raw) {
    return next()
  }
  const token = raw.startsWith("Bearer") ? raw.replace("Bearer ", "").trim() : raw.trim()
  let decoded 
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  } catch {
    return next()
  }
  const user = await User.findById(decoded._id).select("-password -refreshToken")
  if (!user) {
    return next()
  }
  req.user = user
  next()
});