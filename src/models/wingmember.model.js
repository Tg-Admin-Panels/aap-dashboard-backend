import mongoose from "mongoose";

const wingMemberSchema = new mongoose.Schema(
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
            unique: true,
        },
        fbLink: { type: String },
        instafbLink: { type: String },
        xLink: { type: String },
        wing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wing",
            required: true,
        },
    },
    { timestamps: true }
);

const WingMember = mongoose.model("WingMember", wingMemberSchema);
export default WingMember;
