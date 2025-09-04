// utils/sseProgress.js

// Map<formId, Set<Response>>
export const sseClients = new Map();

/** Broadcast progress to all SSE listeners of a formId */
export const sendSseProgress = (formId, data) => {
    const clients = sseClients.get(formId);
    if (!clients) return;
    for (const res of clients) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
};
