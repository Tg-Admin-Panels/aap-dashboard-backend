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
                "checkbox",
            ],
        },
        options: {
            // For 'select' type:
            // - Array of strings for a regular dropdown.
            // - Object for a dependent dropdown, where keys are parent values
            //   and values are arrays of strings (options).
            type: Schema.Types.Mixed,
        },
        dependsOn: {
            // For dependent dropdowns, the 'name' of the parent field.
            type: String,
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
        locationDD: {
            type: Object,
            default: { state: false, district: false, legislativeAssembly: false, booth: false },
        },
    },
    { timestamps: true }
);

export const FormDefinition = mongoose.model(
    "FormDefinition",
    formDefinitionSchema
);
