import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import fileUploadQueue from '../queue.js';
import IORedis from 'ioredis';

// Redis publisher for progress events
const pub = new IORedis();

async function publishProgress(jobId, payload) {
    await pub.publish('sse-progress', JSON.stringify({ jobId, data: payload }));
}

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

        console.log(`[UPLOAD_CONTROLLER] Received file: ${originalname}, Job ID: ${jobId}`);

        await fileUploadQueue.add('processFile', {
            jobId,
            filePath,
            originalname,
            definitionId,
            fileType: lower.endsWith(".csv") ? "csv" : "xlsx",
        });

        console.log(`[UPLOAD_CONTROLLER] Job ${jobId} added to the queue.`);

        // 🔹 Immediately notify client that job is queued
        await publishProgress(jobId, {
            jobId,
            status: "queued",
            processedRows: 0,
            totalRows: null,
            percent: 0,
            message: "File queued for processing"
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { jobId }, "File upload complete. Processing started."));
    });
}

export { handleSseConnection } from "./sse.controller.js";
export { uploadComplete } from "./uploadComplete.controller.js";
