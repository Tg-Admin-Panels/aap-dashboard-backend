import express from "express";
import {
    createWing,
    addLeader,
    addMember,
    getAllWings,
    getWingMembers,
    getAllWingMembers,
    getAllLeaders,
    changeLeader,
    updateMember,
    deleteWingMember,
    deleteWing,
} from "../controllers/wing.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    ensureAdmin,
    ensureAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Route to get all members of a specific wing
router.get("/", getAllWings);
router.get("/all-leaders", getAllLeaders);
router.get("/:wingId/members", getWingMembers);

// Admin Protected Routes
router.use(ensureAuthenticated);
router.use(ensureAdmin);

router.post("/", createWing);
router.post("/:wingId/leader", upload.single("image"), addLeader);
router.post("/:wingId/member", upload.single("image"), addMember);
router.put("/:wingId/leader-change", upload.single("image"), changeLeader);
router.put("/members/update/:memberId", upload.single("image"), updateMember);
router.delete("members/:memberId", deleteWingMember);
router.delete("/:wingId", deleteWing);

export default router;
