import express from "express";
import { addDummyLocations } from "../controllers/dummyData.controller.js";

const router = express.Router();

router.post("/locations", addDummyLocations);

export default router;
