import express from "express";
import { createBooth, getAllBooths, bulkUploadBooths } from "../controllers/booth.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/", createBooth);
router.get("/", getAllBooths);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadBooths);

export default router;
