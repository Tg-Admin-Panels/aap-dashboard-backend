import express from "express";
import {
    createWing,
    addLeader,
    addMember,
    getAllWings,
    getWingMembers,
    getAllWingMembers,
} from "../controllers/wing.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post(
    "/",
    createWing
);
router.post(
    "/:wingId/leader",
    upload.single("image"),
    addLeader
);
router.post(
    "/:wingId/member",
    upload.single("image"),
    addMember
);
router.get("/", getAllWings);
// router.get("/wingmembers", getAllWingMembers)

// Route to get all members of a specific wing
router.get("/:wingId/members", getWingMembers);

export default router;
