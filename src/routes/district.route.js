import express from "express";
import {
    createDistrict,
    getAllDistricts,
    bulkUploadDistricts,
    updateDistrict,
    deleteDistrict
} from "../controllers/district.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";
const router = express.Router();

router.post("/", createDistrict);
router.get("/", getAllDistricts);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadDistricts);
router.put("/:id", updateDistrict);
router.delete("/:id", deleteDistrict);

export default router;
