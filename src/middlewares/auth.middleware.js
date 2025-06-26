import { asyncHandler } from "../utils/asyncHandler";
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