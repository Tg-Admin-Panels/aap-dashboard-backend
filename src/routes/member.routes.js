import express from "express";
import {
    createMember,
    getAllMembers,
    getMemberById,
    getMembersByVolunteer,
    getMembersJoinedBySelf,
} from "../controllers/member.controller.js";

const router = express.Router();

router.post("/", createMember);
router.get("/", getAllMembers);
router.get("/:id", getMemberById);

router.get("/joined-by/self", getMembersJoinedBySelf);
router.get("/joined-by/:volunteerId", getMembersByVolunteer);
export default router;
