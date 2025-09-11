
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";

export const uploadComplete = asyncHandler(async (req, res) => {
    // With BullMQ, the worker handles the processing and sends the final SSE.
    // This endpoint now primarily serves as a client-side signal that the upload is complete.
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Upload complete signal received."));
});
