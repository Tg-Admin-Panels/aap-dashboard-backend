import express from "express";
import {
    createLegislativeAssembly,
    getAllLegislativeAssemblies,
    bulkUploadLegislativeAssemblies
} from "../controllers/legislativeAssembly.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";
const router = express.Router();

router.post("/", createLegislativeAssembly);
router.get("/", getAllLegislativeAssemblies);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadLegislativeAssemblies);

export default router;
