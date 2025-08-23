import mongoose from "mongoose";

const { Schema } = mongoose;

const CampaignSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        bannerImage: {
            type: String, // Cloudinary URL (optional)
            trim: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Campaign", CampaignSchema);
