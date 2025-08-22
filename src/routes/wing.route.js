import express from "express";
import {
    createWing,
    addLeader,
    addMember,
    getAllWings,
    getWingMembers,
    getAllLeaders,
    changeLeader,
    updateMember,
    deleteWingMember,
    deleteWing,
    getWingById,
} from "../controllers/wing.controller.js";
import {
    ensureAdmin,
    ensureAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Route to get all members of a specific wing
router.get("/", getAllWings);
router.get("/all-leaders", getAllLeaders);
router.get("/:wingId", getWingById);
router.get("/:wingId/members", getWingMembers);

// Admin Protected Routes
router.use(ensureAuthenticated);
router.use(ensureAdmin);

router.post("/", createWing);
router.post("/:wingId/leader", addLeader);
router.post("/:wingId/member", addMember);
router.put(
    "/:wingId/leader-change",
    (req, res, next) => {
        console.log("change leader");
        console.log(req.body);
        next();
    },
    changeLeader
);
router.put("/members/update/:memberId", updateMember);
router.delete("members/:memberId", deleteWingMember);
router.delete("/:wingId", deleteWing);

export default router;
