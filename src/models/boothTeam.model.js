import mongoose from "mongoose";

const boothTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    boothName: {
        type: String,
        required: [true, "Booth name is required"],
        trim: true,
    },
    post: {
        type: String,
        enum: ["Prabhari", "Adhyaksh"], // restrict to these 2 roles
        required: true,
    },
    padnaam: {
        type: String,
        required: [true, "Padnaam is required"],
        trim: true,
    },
});

export default mongoose.model("BoothTeam", boothTeamSchema);
