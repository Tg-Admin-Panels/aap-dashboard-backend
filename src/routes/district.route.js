import express from "express";
import { createDistrict, getAllDistricts } from "../controllers/district.controller.js";

const router = express.Router();

router.post("/", createDistrict);
router.get("/", getAllDistricts);

export default router;
