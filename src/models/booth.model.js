import mongoose from "mongoose";

const boothSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        trim: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LegislativeAssembly",
        required: true,
    },
});

export default mongoose.model("Booth", boothSchema);
