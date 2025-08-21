import express from "express";
import { createLegislativeAssembly, getAllLegislativeAssemblies } from "../controllers/legislativeAssembly.controller.js";

const router = express.Router();

router.post("/", createLegislativeAssembly);
router.get("/", getAllLegislativeAssemblies);

export default router;
