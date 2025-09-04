// controllers/xlsxUpload.controller.js
// This keeps your existing route intact and delegates by extension.

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { csvFileUpload } from "./csvUpload.controller.js";
import { xlsxFileUpload } from "./xlsxUpload.controller.js";

// Exported as `uploadChunk` so your current route name stays the same.
export const uploadChunk = asyncHandler(async (req, res, next) => {
    const { originalname } = req.body;
    if (!originalname) {
        throw new ApiError(400, "Missing required field: originalname.");
    }

    const lower = String(originalname).toLowerCase();

    if (lower.endsWith(".csv")) {
        return csvFileUpload(req, res, next);
    }
    if (lower.endsWith(".xlsx")) {
        return xlsxFileUpload(req, res, next);
    }

    throw new ApiError(
        400,
        "Unsupported file type. Only CSV and XLSX are supported."
    );
});

// (Re)export helpers if your routes import them from here
export { handleSseConnection } from "./sse.controller.js";
export { uploadComplete } from "./uploadComplete.controller.js";
