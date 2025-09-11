import express from 'express';
import { createUploadChunkHandler, handleSseConnection, uploadComplete } from '../controllers/upload.controller.js';
import { uploadMiddleware } from '../../app.js'; // Import uploadMiddleware

export default function createUploadRouter() {
    const router = express.Router();

    const uploadChunkHandler = createUploadChunkHandler();

    // File upload routes
    router.post('/:definitionId/submissions/upload-chunk', uploadMiddleware.single('file'), uploadChunkHandler);
    router.get('/:definitionId/submissions/events', handleSseConnection);
    router.post('/:definitionId/submissions/upload-complete', uploadComplete);

    return router;
};
