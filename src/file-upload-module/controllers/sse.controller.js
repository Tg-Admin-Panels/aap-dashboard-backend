
import asyncHandler from "../../utils/asyncHandler.js";
import { addSseConnection, removeSseConnection } from "../utils/sseProgress.js";

export const handleSseConnection = asyncHandler(async (req, res) => {
    const { definitionId } = req.params;

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });

    addSseConnection(definitionId, res);

    // Remove connection when client disconnects
    req.on("close", () => {
        removeSseConnection(definitionId);
    });
});
