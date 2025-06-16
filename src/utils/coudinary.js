import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteImageFromCloudinary = async (publicLink) => {
    try {
        if (!publicLink) return null;
        const publicId = publicLink.split("/").splice(-1)[0].split(".")[0];
        console.log(publicId);

        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
        });
        console.log("File deleted from cloudinary ", response.result);
        return response;
    } catch (error) {
        return null;
    }
};
const deleteVideoFromCloudinary = async (publicLink) => {
    try {
        if (!publicLink) return null;
        const publicId = publicLink.split("/").splice(-1)[0].split(".")[0];
        console.log(publicId);

        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "video",
        });
        console.log("File deleted from cloudinary ", response.result);
        return response;
    } catch (error) {
        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteImageFromCloudinary,
    deleteVideoFromCloudinary,
};
