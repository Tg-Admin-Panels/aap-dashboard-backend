import express from 'express';
import { createUploadChunkHandler, handleSseConnection, uploadComplete } from '../controllers/upload.controller.js';
import { uploadMiddleware } from '../../middlewares/multer.middleware.js'; // Import uploadMiddleware

export default function createUploadRouter(dataHandler) {
    const router = express.Router();

    const uploadChunkHandler = createUploadChunkHandler(dataHandler);

    // File upload routes
    router.post('/:definitionId/submissions/upload-chunk', uploadMiddleware.single('file'), uploadChunkHandler);
    router.get('/:definitionId/submissions/events', handleSseConnection);
    router.post('/:definitionId/submissions/upload-complete', uploadComplete);

    return router;
};
