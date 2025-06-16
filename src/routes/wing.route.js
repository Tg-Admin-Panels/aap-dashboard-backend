import express from "express";
import {
    createWing,
    addLeader,
    addMember,
    getAllWings,
    getWingMembers,
} from "../controllers/wing.controller.js";

const router = express.Router();

router.post("/", createWing);
router.post("/:wingId/leader", addLeader);
router.post("/:wingId/member", addMember);
router.get("/", getAllWings);

// Route to get all members of a specific wing
router.get("/:wingId/members", getWingMembers);

export default router;
