import mongoose from "mongoose";

const { Schema } = mongoose;

const FeedbackForm = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: true,
            match: /^[0-9]{10}$/, // only 10-digit mobile numbers
        },
        state: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        vidhansabha: {
            type: String,
            required: true,
        },
        support: {
            type: Boolean,
            default: false, // "haan mai samarth karta hu"
        },
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("FeedbackForm", FeedbackForm);
