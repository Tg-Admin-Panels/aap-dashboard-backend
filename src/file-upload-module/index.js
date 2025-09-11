import createUploadRouter from './routes/upload.routes.js';

export default function setupUploadModule(app) {
    const uploadRouter = createUploadRouter();
    // Mount the upload routes under /api/v1/uploads
    app.use('/api/v1/uploads', uploadRouter);
}

// Export the router factory separately
export { createUploadRouter };
