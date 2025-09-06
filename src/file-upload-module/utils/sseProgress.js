const sseConnections = new Map();

export function sendSseProgress(id, data) {
    const res = sseConnections.get(id);
    console.log(`[SSE_PROGRESS] Attempting to send SSE for ID: ${id}, Data: ${JSON.stringify(data)}`);
    if (res) {
        console.log(`[SSE_PROGRESS] SSE connection found for ID: ${id}. Writing data.`);
        res.write(`data: ${JSON.stringify(data)}

`);
    } else {
        console.log(`[SSE_PROGRESS] No SSE connection found for ID: ${id}. This means the client might have disconnected or the ID is incorrect.`);
    }
}

export function addSseConnection(id, res) {
    sseConnections.set(id, res);
    console.log(`[SSE_PROGRESS] Added SSE connection for ID: ${id}. Total connections: ${sseConnections.size}`);
}

export function removeSseConnection(id) {
    sseConnections.delete(id);
    console.log(`[SSE_PROGRESS] Removed SSE connection for ID: ${id}. Total connections: ${sseConnections.size}`);
}
