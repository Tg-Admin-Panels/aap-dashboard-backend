import express from "express";
import {
    createLegislativeAssembly,
    getAllLegislativeAssemblies,
    bulkUploadLegislativeAssemblies,
    updateLegislativeAssembly,
    deleteLegislativeAssembly
} from "../controllers/legislativeAssembly.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";
const router = express.Router();

router.post("/", createLegislativeAssembly);
router.get("/", getAllLegislativeAssemblies);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadLegislativeAssemblies);
router.put("/:id", updateLegislativeAssembly);
router.delete("/:id", deleteLegislativeAssembly);

export default router;
