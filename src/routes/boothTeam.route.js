import express from "express";
import {
    createBoothTeamMember,
    getAllBoothTeamMembers,
    getBoothTeamMemberById,
    updateBoothTeamMember,
    deleteBoothTeamMember,
} from "../controllers/boothTeam.controller.js";

const router = express.Router();

// Create a new booth team member
router.post("/", createBoothTeamMember);

// Get all booth team members
router.get("/", getAllBoothTeamMembers);

// Get a single booth team member by ID
router.get("/:id", getBoothTeamMemberById);

// Update a booth team member by ID
router.put("/:id", updateBoothTeamMember);

// Delete a booth team member by ID
router.delete("/:id", deleteBoothTeamMember);

export default router;
