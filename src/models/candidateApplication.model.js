// models/candidateApplication.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const CandidateApplicationSchema = new Schema(
    {
        // Basic identity
        applicantName: {
            type: String,
            required: [true, "Applicant name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [120, "Name cannot exceed 120 characters"],
        },

        // Location (use your existing masters)
        state: {
            type: Schema.Types.ObjectId,
            ref: "State",
        },
        district: {
            type: Schema.Types.ObjectId,
            ref: "District",
            required: [true, "District is required"],
        },
        legislativeAssembly: {
            type: Schema.Types.ObjectId,
            ref: "LegislativeAssembly",
            required: [true, "Legislative Assembly is required"],
        },

        // Contact
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
            match: [/^\d{10}$/, "Mobile number must be a 10‑digit number"],
            index: true,
        },
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true,
            maxlength: 500,
        },

        // Campaign/Activity counts
        harGharJhandaCount: {
            type: Number,
            required: [true, "Count for 'Har Ghar Jhanda' is required"],
            min: [0, "Count cannot be negative"],
            default: 0,
        },
        janAakroshMeetingsCount: {
            type: Number,
            required: [true, "Count for 'Jan Aakrosh meetings' is required"],
            min: [0, "Count cannot be negative"],
            default: 0,
        },
        communityMeetingsCount: {
            type: Number,
            required: [true, "Count for 'Community meetings' is required"],
            min: [0, "Count cannot be negative"],
            default: 0,
        },

        // Social media
        facebookFollowers: {
            type: Number,
            required: [true, "Facebook followers count is required"],
            min: [0, "Followers cannot be negative"],
            default: 0,
        },
        facebookPageLink: {
            type: String,
            required: [true, "Facebook page link is required"],
            trim: true,
            match: [
                /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=.]*)?$/,
                "Enter a valid URL",
            ],
        },
        instagramFollowers: {
            type: Number,
            required: [true, "Instagram followers count is required"],
            min: [0, "Followers cannot be negative"],
            default: 0,
        },
        instagramLink: {
            type: String,
            required: [true, "Instagram link is required"],
            trim: true,
            match: [
                /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=.]*)?$/,
                "Enter a valid URL",
            ],
        },

        // Biodata PDF (max 10MB should be enforced at upload layer)
        biodataPdfUrl: {
            type: String,
            required: [true, "Biodata PDF is required"],
            trim: true,
        },
        biodataPdfPublicId: {
            type: String, // e.g., Cloudinary public_id (optional but useful)
            trim: true,
        },

        // Meta
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

// Helpful compound index for lookups by location + mobile
CandidateApplicationSchema.index(
    { district: 1, legislativeAssembly: 1, mobile: 1 },
    { name: "by_area_and_mobile" }
);

const CandidateApplication = mongoose.model(
    "CandidateApplication",
    CandidateApplicationSchema
);

export default CandidateApplication;
