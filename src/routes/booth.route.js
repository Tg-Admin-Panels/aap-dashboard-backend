import express from "express";
import { createBooth, getAllBooths } from "../controllers/booth.controller.js";

const router = express.Router();

router.post("/", createBooth);
router.get("/", getAllBooths);

export default router;
