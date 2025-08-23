import mongoose from "mongoose";

const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        campaign: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Comment", CommentSchema);
