// upload.controller.js
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import fileUploadQueue from '../queue.js';
import { sendSseProgress } from "../utils/sseProgress.js";

export function createUploadChunkHandler() {
    return asyncHandler(async (req, res) => {
        const { definitionId } = req.params;
        const file = req.file;

        if (!file) {
            throw new ApiError(400, "No file uploaded.");
        }

        const { path: filePath, originalname } = file;

        const lower = String(originalname).toLowerCase();
        if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
            throw new ApiError(400, "Unsupported file type. Only CSV and XLSX are supported.");
        }

        const jobId = req.jobId;

        await fileUploadQueue.add('processFile', {
            jobId,
            filePath,
            originalname,
            definitionId,
            fileType: lower.endsWith(".csv") ? "csv" : "xlsx",
        });

        // 🔹 Send initial SSE status: queued
        sendSseProgress(definitionId, {
            jobId,
            status: "queued",
            processedRows: 0,
            totalRows: null,
            percent: 0,
            message: "File queued for processing"
        });

        return res.status(200).json(new ApiResponse(200, { jobId }, "File upload complete. Processing started."));
    });
}

export { handleSseConnection } from "./sse.controller.js";
export { uploadComplete } from "./uploadComplete.controller.js";
