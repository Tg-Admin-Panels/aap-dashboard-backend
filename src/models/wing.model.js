// models/Wing.js
import mongoose from "mongoose";

const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Sub-schemas
 */
const CtaSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        variant: {
            type: String,
            enum: ["primary", "secondary", "link"],
            default: "primary",
        },
    },
    { _id: false }
);

const BulletSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const ImageSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, trim: true },
        alt: { type: String, trim: true },
        caption: { type: String, trim: true },
        glow: {
            enabled: { type: Boolean, default: false },
            color: { type: String, trim: true, default: "#d1fa1d" }, // Tailwind yellow-like
        },
        aspectRatio: { type: String, trim: true }, // "16:9", "4:3" etc (optional)
    },
    { _id: false }
);

const HeroSchema = new mongoose.Schema(
    {
        // MAIN WING – title के highlighted हिस्से का control
        title: { type: String, required: true, trim: true }, // e.g., "MAIN WING"
        highlight: { type: String, trim: true }, // e.g., "WING" (if you style a part in accent)
        subtitle: { type: String, trim: true }, // small eyebrow text (optional)
        description: { type: String, trim: true }, // leading paragraph
        bullets: { type: [BulletSchema], default: [] }, // 3 bullet points जैसा UI
        image: ImageSchema, // right-side illustrative card image with glow
        ctas: {
            primary: { type: CtaSchema },
            secondary: { type: CtaSchema },
        },
    },
    { _id: false }
);

const SectionHeaderSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true }, // e.g., "OUR LEADERS"
        subtitle: { type: String, trim: true }, // small description under section title
    },
    { _id: false }
);

/**
 * Main Wing schema
 */
const wingSchema = new mongoose.Schema(
    {
        // Identity
        name: { type: String, required: true, unique: true, trim: true }, // e.g., "Main Wing"
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Relations
        leader: { type: ObjectId, ref: "WingMember" }, // featured leader (hero में भी use कर सकते हैं)
        members: [{ type: ObjectId, ref: "WingMember" }], // grid list

        // Page content blocks
        hero: { type: HeroSchema, required: true },
        ourLeadersSection: {
            type: SectionHeaderSchema,
            default: {
                title: "OUR LEADERS",
                subtitle:
                    "Meet the dynamic young leaders who are driving innovation, embracing technology, and championing sustainable development for a better tomorrow.",
            },
        },
    },
    { timestamps: true }
);

/** indexes */
wingSchema.index({ slug: 1 }, { unique: true });
wingSchema.index(
    { name: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } }
);

/** virtuals */
wingSchema.virtual("membersCount", {
    ref: "WingMember",
    localField: "members",
    foreignField: "_id",
    count: true,
});

const Wing = mongoose.model("Wing", wingSchema);
export default Wing;
