import asyncHandler from "../../utils/asyncHandler.js";
import { addSseConnection, removeSseConnection } from "../utils/sseProgress.js";

export const handleSseConnection = asyncHandler(async (req, res) => {
    const { jobId } = req.query; // 🔹 client should send ?jobId=xxx

    if (!jobId) {
        res.status(400).end("Missing jobId for SSE connection");
        return;
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });

    // 🔹 Register SSE connection by jobId
    addSseConnection(jobId, res);

    // Send initial handshake event
    res.write(`event: connected\ndata: "SSE connection established for job ${jobId}"\n\n`);

    req.on("close", () => {
        removeSseConnection(jobId);
    });
});
