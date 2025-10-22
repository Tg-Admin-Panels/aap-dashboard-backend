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

    state: {
        type: String,
        required: [true, "State name is required"],
        trim: true,
    },
    district: {
        type: String,
        required: [true, "District name is required"],
        trim: true,
    },
    legislativeAssembly: {
        type: String,
        required: [true, "Assembly name is required"],
        trim: true,
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
