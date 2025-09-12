import express from "express";
import {
    createDistrict,
    getAllDistricts,
    bulkUploadDistricts
} from "../controllers/district.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";
const router = express.Router();

router.post("/", createDistrict);
router.get("/", getAllDistricts);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadDistricts);

export default router;
