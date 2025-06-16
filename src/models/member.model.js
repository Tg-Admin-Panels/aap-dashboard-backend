import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        role: { type: String, enum: ["leader", "member"], required: true },
        post: {
            type: String,
        },
        image: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        wing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wing",
            required: true,
        },
    },
    { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);
export default Member;
