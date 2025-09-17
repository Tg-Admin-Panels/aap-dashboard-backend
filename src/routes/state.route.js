import express from "express";
import { createState, getAllStates, bulkUploadStates, updateState, deleteState } from "../controllers/state.controller.js";
import { uploadMiddleware } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/", createState);
router.get("/", getAllStates);
router.post("/bulk-upload", uploadMiddleware.single("file"), bulkUploadStates);
router.put("/:id", updateState);
router.delete("/:id", deleteState);

export default router;
