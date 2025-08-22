import express from "express";
import { getCloudinarySignature } from "../controllers/cloudinary.controller.js";

const router = express.Router();

router.post("/signature", getCloudinarySignature);

export default router;
