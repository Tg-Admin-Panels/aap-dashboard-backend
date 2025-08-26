import { v2 as cloudinary } from "cloudinary";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getCloudinarySignature = asyncHandler(async (req, res) => {
    const { folder } = req.body;

    if (!folder) {
        throw new ApiError(400, "Folder name is required");
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp: timestamp,
            folder: folder,
        },
        cloudinary.config().api_secret
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                signature,
                timestamp,
                cloudname: cloudinary.config().cloud_name,
                api_key: cloudinary.config().api_key,
            },
            "Cloudinary signature generated successfully"
        )
    );
});
