// utils/sseProgress.js

// Map<formId, Set<Response>>
export const sseClients = new Map();

/** Broadcast progress to all SSE listeners of a formId */
export const sendSseProgress = (formId, data) => {
    const clients = sseClients.get(formId);
    if (!clients) return;
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
        try {
            res.write(payload);
        } catch (_) {
            // client may have disconnected
        }
    }
};
