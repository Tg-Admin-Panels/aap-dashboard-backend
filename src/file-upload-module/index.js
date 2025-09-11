import createUploadRouter from './routes/upload.routes.js';

export default function setupUploadModule(app, dataHandler) {
    if (!dataHandler) {
        throw new Error("A dataHandler function must be provided to setupUploadModule.");
    }
    const uploadRouter = createUploadRouter(dataHandler);
    // Mount the upload routes under /api/v1/uploads
    app.use('/api/v1/uploads', uploadRouter);
}

// Export the router factory separately
export { createUploadRouter };
