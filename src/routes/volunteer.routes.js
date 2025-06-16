import express from "express";
import {
    createVolunteer,
    getAllVolunteers,
    getVolunteerById,
    updateVolunteer,
    deleteVolunteer,
} from "../controllers/volunteer.controller.js";

const router = express.Router();

router.post("/", createVolunteer);
router.get("/", getAllVolunteers);
router.get("/:id", getVolunteerById);
router.put("/:id", updateVolunteer);
router.delete("/:id", deleteVolunteer);

export default router;
