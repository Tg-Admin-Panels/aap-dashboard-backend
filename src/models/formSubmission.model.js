import mongoose, { Schema } from "mongoose";

const formSubmissionSchema = new Schema(
    {
        formId: {
            type: Schema.Types.ObjectId,
            ref: "FormDefinition",
            required: true,
        },
        data: {
            type: Schema.Types.Mixed, // Allows storing flexible, dynamic data
            required: true,
        },
    },
    { timestamps: true }
);

export const FormSubmission = mongoose.model(
    "FormSubmission",
    formSubmissionSchema
);
