import mongoose from "mongoose";

const visionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true, // e.g. "Powering Progress"
            trim: true,
        },
        image: {
            type: String,
            required: false, // card की image URL
        },
        points: [
            {
                type: String,
                required: true, // e.g. "Free Electricity up to 200 units..."
            },
        ],
        icon: {
            type: String,
            required: false, // optional small icon
        },
    },
    { timestamps: true }
);

const Vision = mongoose.model("Vision", visionSchema);

export default Vision;
