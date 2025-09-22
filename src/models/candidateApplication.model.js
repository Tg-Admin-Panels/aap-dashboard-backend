// models/candidateApplication.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const CandidateApplicationSchema = new Schema(
    {
        // ================== 1. व्यक्तिगत विवरण ==================
        // Text input
        applicantName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },

        // Text input
        fatherName: { type: String, required: true, trim: true, maxlength: 120 },

        // Text input
        fatherOccupation: { type: String, trim: true, maxlength: 120 },

        // Use Date picker
        dob: { type: Date, required: true },

        // Auto-calc from DOB or manual
        age: { type: Number, min: 0 },

        // Enum: "Male"
        gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

        // Dropdown
        religion: { type: String, trim: true },

        // Enum: "Married"
        maritalStatus: { type: String, enum: ["Married", "Unmarried", "Other"] },

        // Dropdown
        state: { type: Schema.Types.ObjectId, ref: "State" },

        // Dropdown
        district: { type: Schema.Types.ObjectId, ref: "District", required: true },

        // Dropdown
        legislativeAssembly: { type: Schema.Types.ObjectId, ref: "LegislativeAssembly", required: true },

        // TextArea
        address: { type: String, required: true, trim: true, maxlength: 500 },

        // 6-digit, validate with regex
        pincode: { type: String, match: [/^\d{6}$/, "Enter a valid 6-digit pincode"] },

        // ================== 2. संपर्क विवरण ==================
        // Validate: 10 digits
        mobile: { type: String, required: true, match: [/^\d{10}$/, "Enter a valid 10-digit mobile number"], index: true },

        // Validate: 10 digits
        whatsapp: { type: String, match: [/^\d{10}$/, "Enter a valid 10-digit WhatsApp number"] },

        // Validate email format
        email: { type: String, match: [/^\S+@\S+\.\S+$/, "Enter a valid email"], lowercase: true, trim: true },

        // Only numbers (min=0)
        facebookFollowers: { type: Number, default: 0, min: 0 },

        // URL (validate starts with http/https)
        facebookLink: { type: String, match: [/^https?:\/\/.+/, "Enter a valid URL"] },

        // Only numbers (min=0)
        instagramFollowers: { type: Number, default: 0, min: 0 },

        // URL
        instagramLink: { type: String, match: [/^https?:\/\/.+/, "Enter a valid URL"] },

        // ================== 3. शैक्षिक एवं आर्थिक विवरण ==================
        // Text input
        education: { type: String, trim: true },

        // Regex: 10-char format
        panNumber: { type: String, match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter a valid PAN number"] },

        // text
        occupation: { type: String, trim: true },

        // Optional
        occupation1: { type: String, trim: true },

        // Optional
        occupation2: { type: String, trim: true },

        // Optional
        occupation3: { type: String, trim: true },

        // Numeric
        itrAmount: { type: Number, min: 0 },

        // Numeric
        totalAssets: { type: Number, min: 0 },

        // Text
        vehicleDetails: { type: String, trim: true },

        // ================== 4. चुनाव सम्बन्धी विवरण ==================
        // Dropdown
        pastElection: { type: String, enum: ["लोकसभा", "विधानसभा", "नगर पालिका", "वार्ड पार्षद", "सांसद", "उप मुख्य पार्षद", "मुख्य पार्षद", "ग्राम पंचायत के सदस्य", "ग्राम कचहरी के पंच", "ग्राम पंचायत के मुखिया", "ग्राम कचहरी के सरपंच", "पंचायत समिति के सदस्य", "जिला परिषद्  के सदस्य", "पैक्स", "अन्य", "नहीं"] },

        // Numeric
        totalBooths: { type: Number, min: 0 },

        // Numeric
        activeBooths: { type: Number, min: 0 },

        // ================== 5. टीम विवरण ==================
        // Array of objects
        teamMembers: [
            {
                // Name
                name: { type: String, trim: true },

                // Validate 10 digits
                mobile: { type: String, match: [/^\d{10}$/, "Enter a valid 10-digit mobile number"] },
            },
        ],

        // ================== 6. सामाजिक गतिविधियाँ ==================
        // TextArea
        socialPrograms: { type: String, trim: true },

        // ================== 7. आगामी कार्यक्रम ==================
        // Date picker
        programDate: { type: Date },

        // Date picker
        meetingDate: { type: Date },

        // ================== 8. जीवनी ==================
        // Accept only .pdf, max size 10 MB
        biodataPdf: { type: String, required: true, trim: true },

        biodataPdfPublicId: { type: String, trim: true },

        // ================== Meta ==================
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },

        notes: { type: String, maxlength: 1000, trim: true },
    },
    { timestamps: true }
);

// Compound index for quick lookups
CandidateApplicationSchema.index(
    { district: 1, constituency: 1, mobile: 1 },
    { name: "by_area_and_mobile" }
);

const CandidateApplication = mongoose.model("CandidateApplication", CandidateApplicationSchema);

export default CandidateApplication;
