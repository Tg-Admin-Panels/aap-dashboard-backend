import asyncHandler from "../../utils/asyncHandler.js";
import IORedis from "ioredis";
import { addSseConnection, removeSseConnection } from "../utils/sseProgress.js";

const redis = new IORedis(); // same Redis instance for replay

export const handleSseConnection = asyncHandler(async (req, res) => {
    const { jobId } = req.query;

    if (!jobId) {
        res.status(400).end("Missing jobId for SSE connection");
        return;
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });

    // 🔹 Replay past events from Redis list
    const pastEvents = await redis.lrange(`job:${jobId}:events`, 0, -1);
    pastEvents.forEach(ev => {
        res.write(`data: ${ev}\n\n`);
    });

    // 🔹 Register SSE connection by jobId (for live events)
    addSseConnection(jobId, res);

    // Initial handshake
    res.write(`event: connected\ndata: "SSE connection established for job ${jobId}"\n\n`);

    req.on("close", () => {
        removeSseConnection(jobId);
    });
});
