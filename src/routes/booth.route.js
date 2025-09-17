import express from "express";
import { createBooth, getAllBooths, bulkUploadBooths, updateBooth, deleteBooth } from "../controllers/booth.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/", createBooth);
router.get("/", getAllBooths);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadBooths);
router.put("/:id", updateBooth);
router.delete("/:id", deleteBooth);

export default router;
