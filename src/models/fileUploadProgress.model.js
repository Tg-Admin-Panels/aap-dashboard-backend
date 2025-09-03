import mongoose, { Schema } from "mongoose";

const fileUploadProgressSchema = new Schema(
    {
        uploadId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        formId: {
            type: Schema.Types.ObjectId,
            ref: "FormDefinition",
            required: true,
        },
        filename: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            enum: ["csv", "xlsx"],
            required: true,
        },
        lastProcessedRow: {
            type: Number,
            default: 0,
        },
        lastProcessedChunkIndex: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["in_progress", "completed", "failed"],
            default: "in_progress",
        },
        headers: {
            type: [String],
            default: [],
        },
        tempFilePath: {
            type: String,
        },
    },
    { timestamps: true }
);

export const FileUploadProgress = mongoose.model(
    "FileUploadProgress",
    fileUploadProgressSchema
);
