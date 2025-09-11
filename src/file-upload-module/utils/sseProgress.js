import IORedis from 'ioredis';

const sseConnections = new Map();

// Redis subscriber
const sub = new IORedis();

sub.on('error', (err) => {
    console.error('[SSE_PROGRESS] Redis subscriber error:', err);
});

// Subscribe to channel
await sub.subscribe('sse-progress');

sub.on('message', (channel, message) => {
    try {
        const parsed = JSON.parse(message);
        if (!parsed || !parsed.jobId || !parsed.data) {
            console.error("[SSE_PROGRESS] Invalid pubsub payload:", message);
            return;
        }

        const { jobId, data } = parsed;
        console.log(`[SSE_PROGRESS] Received event for Job: ${jobId}`, data);

        const res = sseConnections.get(jobId);
        if (res) {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } else {
            console.log(`[SSE_PROGRESS] No active SSE connection for Job: ${jobId}`);
        }
    } catch (err) {
        console.error("[SSE_PROGRESS] Failed to handle pubsub message:", err, "Raw:", message);
    }
});

// ---------------- SSE Connection Management ----------------
export function addSseConnection(jobId, res) {
    sseConnections.set(jobId, res);
    console.log(`[SSE_PROGRESS] Added SSE connection for Job: ${jobId}. Total: ${sseConnections.size}`);
}

export function removeSseConnection(jobId) {
    sseConnections.delete(jobId);
    console.log(`[SSE_PROGRESS] Removed SSE connection for Job: ${jobId}. Total: ${sseConnections.size}`);
}
