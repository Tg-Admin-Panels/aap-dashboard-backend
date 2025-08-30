import express from "express";
import {
    createMember,
    getAllMembers,
    getMemberById,
    getMembersByVolunteer,
    getMembersJoinedBySelf,
    updateMember,
    deleteMember,
} from "../controllers/member.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", createMember);

router.use(ensureAuthenticated);
router.get("/", getAllMembers);
router.get("/:id", getMemberById);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);

router.get("/joined-by/self", getMembersJoinedBySelf);
router.get("/joined-by/:volunteerId", getMembersByVolunteer);
export default router;
