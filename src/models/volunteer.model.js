import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        age: { type: Number, required: true },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true,
        },
        mobileNumber: { type: String, required: true, match: /^[6-9]\d{9}$/ },
        religion: { type: String },
        occupation: {
            type: String,
            enum: [
                "Political Volunteer",
                "Self-Employed",
                "Business Owner",
                "Farmer",
            ],
        },
        income: { type: String },
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
    },
    { timestamps: true }
);

export default mongoose.model("Volunteer", volunteerSchema);
