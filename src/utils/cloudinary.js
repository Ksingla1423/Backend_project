// user->local server path -> cloudinary 
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
})

const uploadOnClouidnary = async (localFilePath)=>{
    try {
        if(!localFilePath) return "could not find the file";
        const result= await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
        })
        // files has been uploaded succesfuly
    console.log("file uploaded on cloudinary",result.url);
    return result;  
    
    } catch (error) {
        fs.unlinkSync(localFilePath); // delete the file from local server
        return null;
        
    }
}


export { uploadOnClouidnary };


    // const uploadResult = await cloudinary.uploader
    //     .upload(
    //         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
    //             public_id: 'shoes',
    //         }
    //     )
    //     .catch((error) => {
    //         console.log(error);
    //     });