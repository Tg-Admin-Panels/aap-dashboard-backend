// controllers/xlsxUpload.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// IMPORT your split handlers:
import { csvFileUpload } from "./csvUpload.controller.js";
import { xlsxFileUpload } from "./xlsxUpload.controller.js";

/**
 * This is the ONLY controller wired to the existing route.
 * It delegates to CSV or XLSX handler based on file extension.
 */
export const uploadChunk = asyncHandler(async (req, res, next) => {
    const { originalname } = req.body;

    if (!originalname) {
        throw new ApiError(400, "Missing required field: originalname.");
    }

    const lower = String(originalname).toLowerCase();

    if (lower.endsWith(".csv")) {
        // Delegate to CSV chunk handler
        return csvFileUpload(req, res, next);
    }

    if (lower.endsWith(".xlsx")) {
        // Delegate to XLSX chunk handler
        return xlsxFileUpload(req, res, next);
    }

    throw new ApiError(
        400,
        "Unsupported file type. Only CSV and XLSX are supported."
    );
});

/**
 * If you also expose SSE and uploadComplete from this file earlier,
 * just re-export them from their respective modules OR keep previous implementations.
 * Example (if you moved them out):
 *
 * export { handleSseConnection } from "./sse.controller.js";
 * export { uploadComplete } from "./uploadComplete.controller.js";
 */
