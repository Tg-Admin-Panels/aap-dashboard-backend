import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        mobileNumber: {
            type: String,
            required: true,
            match: /^[6-9]\d{9}$/,
            unique: true,
        },
        joinedBy: {
            type: String,
            enum: ["self", "volunteer"],
            required: true,
        },
        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            required: function () {
                return this.joinedBy === "volunteer";
            },
        },
    },
    { timestamps: true }
);

export default mongoose.model("Member", memberSchema);
