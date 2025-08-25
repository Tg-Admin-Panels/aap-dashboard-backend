import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true,
        },
        mobileNumber: { type: String, required: true, match: /^[6-9]\d{9}$/ },

        profilePicture: { type: String },

        zone: { type: String, enum: ["Urban", "Rural"], required: true },

        district: { type: String, required: true },
        block: { type: String, required: true },
        wardNumber: { type: String },
        boothNumber: { type: String },
        pinCode: { type: String },
        postOffice: { type: String },

        // Urban specific
        cityName: { type: String },
        streetOrLocality: { type: String },

        // Rural specific
        panchayat: { type: String },
        villageName: { type: String },
        status: {
            type: String,
            enum: ["active", "blocked"],
            default: "active",
        },
        howCanYouHelpUs: { type: String },
        inWhichFieldYouCanContribute: { type: String },
        howMuchTimeYouDedicate: { type: String },
        whyYouWantToJoinUs: { type: String },
    },
    { timestamps: true }
);

const Volunteer = mongoose.model("Volunteer", volunteerSchema);
export default Volunteer;
