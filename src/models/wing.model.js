import mongoose from "mongoose";

const wingSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        leader: { type: mongoose.Schema.Types.ObjectId, ref: "WingMember" },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "WingMember" }],
    },
    { timestamps: true }
);

const Wing = mongoose.model("Wing", wingSchema);
export default Wing;
