import express from "express";
import { createState, getAllStates } from "../controllers/state.controller.js";

const router = express.Router();

router.post("/", createState);
router.get("/", getAllStates);

export default router;
