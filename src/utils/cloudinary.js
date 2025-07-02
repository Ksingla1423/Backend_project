import {v2 as cloudinary} from "cloudinary"
// import { log } from "console";
import fs from "fs"

console.log("Cloudinary Key:", process.env.CLOUDINARY_API_KEY);
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
console.log("Cloudinary Key:", process.env.CLOUDINARY_API_KEY);
function publicId(url) {
  if (!url) return null;
  url = url.split('?')[0];
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return matches ? matches[1] : null;
}


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        // console.log("response",localFilePath);
        const response = await cloudinary.uploader.upload(localFilePath, {
          resource_type: "auto"
        })
        // console.log("response",response);
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log("error",error);
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return result;
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    throw new Error("Deletion failed");
  }
};



export {uploadOnCloudinary, deleteFromCloudinary , publicId};