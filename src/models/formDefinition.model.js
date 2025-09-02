import mongoose, { Schema } from "mongoose";

const fieldSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "text",
                "email",
                "password",
                "number",
                "date",
                "textarea",
                "select",
                "file",
            ],
        },
        options: {
            // Only used for 'select' type
            type: [String],
        },
        required: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const formDefinitionSchema = new Schema(
    {
        formName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        fields: {
            type: [fieldSchema],
            required: true,
        },
    },
    { timestamps: true }
);

export const FormDefinition = mongoose.model(
    "FormDefinition",
    formDefinitionSchema
);
