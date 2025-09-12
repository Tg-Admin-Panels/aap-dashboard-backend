
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from 'uuid';

// Define storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'tmp', 'uploads'));
    },
    filename: (req, file, cb) => {
        req.jobId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        cb(null, `${req.jobId}${fileExtension}`); // Use req.jobId
    }
});

export const uploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});
