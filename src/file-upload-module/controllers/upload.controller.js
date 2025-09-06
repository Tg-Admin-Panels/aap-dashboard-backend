
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { v4 as uuidv4 } from 'uuid';
import fileUploadQueue from '../queue.js';
// Removed writeChunk as multer handles file saving
// import { writeChunk } from '../utils/tempFileStorage.js';

export function createUploadChunkHandler(dataHandler) {
    return asyncHandler(async (req, res) => {
        const { definitionId } = req.params;
        // Multer places the file information in req.file
        const file = req.file;

        if (!file) {
            throw new ApiError(400, "No file uploaded.");
        }

        const { path: filePath, originalname } = file;

        const lower = String(originalname).toLowerCase();
        if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
            throw new ApiError(400, "Unsupported file type. Only CSV and XLSX are supported.");
        }

        const jobId = uuidv4(); // Generate a unique jobId for the entire upload session

        await fileUploadQueue.add('processFile', {
            jobId,
            filePath,
            originalname,
            definitionId,
            fileType: lower.endsWith(".csv") ? "csv" : "xlsx",
        });

        return res.status(200).json(new ApiResponse(200, { jobId }, "File upload complete. Processing started."));
    });
}

export { handleSseConnection } from "./sse.controller.js";
export { uploadComplete } from "./uploadComplete.controller.js";
