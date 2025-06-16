const mongoose = require("mongoose");

const BoothWiseVotersSchema = new mongoose.Schema(
    {
        srNo: { type: Number, required: true },
        voterId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        gaurdian: { type: String },
        house: { type: String },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true,
        },
        age: { type: Number },
        party: { type: String },
        sureVote: { type: Boolean, default: false },
        voterType: { type: String },
        religion: { type: String },
        cast: { type: String },
        education: { type: String },
        mobile: { type: String },
        status: { type: String },
        location: { type: String },
        concern: { type: String },
        voted: {
            type: Boolean,
            default: false,
        },
        booth: {
            type: mongoose.Schema.ObjectId,
            ref: "Booth",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("BoothWiseVoters", BoothWiseVotersSchema);
