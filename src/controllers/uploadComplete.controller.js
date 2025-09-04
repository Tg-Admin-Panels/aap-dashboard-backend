// controllers/uploadComplete.controller.js

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadSessions } from "../utils/uploadSessions.js";
import { sendSseProgress } from "../utils/sseProgress.js";

export const uploadComplete = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { originalname } = req.body;

    const sessionId = `${formId}-${originalname}`;
    const session = uploadSessions.get(sessionId);

    if (session) {
        // emit a final "completed" if not already emitted
        sendSseProgress(formId, {
            status: "completed",
            processedRows: session.totalRowsProcessed,
            processedBytes: session.processedBytes || 0,
        });
        uploadSessions.delete(sessionId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Upload complete signal received."));
});
