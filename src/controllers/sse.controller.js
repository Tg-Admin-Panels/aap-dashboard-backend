// controllers/sse.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sseClients } from "../utils/sseProgress.js";

export const handleSseConnection = asyncHandler(async (req, res) => {
    const { formId } = req.params;

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });

    if (!sseClients.has(formId)) sseClients.set(formId, new Set());
    sseClients.get(formId).add(res);

    // initial ping
    res.write('data: {"message": "Connected to SSE stream"}\n\n');

    req.on("close", () => {
        const set = sseClients.get(formId);
        if (set) {
            set.delete(res);
            if (set.size === 0) sseClients.delete(formId);
        }
    });
});
