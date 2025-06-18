import express from "express";
import {
    createVolunteer,
    getAllVolunteers,
    getVolunteerById,
    updateVolunteer,
    deleteVolunteer,
    updateVolunteerStatus,
} from "../controllers/volunteer.controller.js";
import {
    ensureAdmin,
    ensureAuthenticated,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/", upload.single("profilePicture"), createVolunteer);

router.use(ensureAuthenticated);
router.get("/", ensureAdmin, getAllVolunteers);
router.get("/:id", getVolunteerById);
// router.put("/:id",  updateVolunteer);
router.delete("/:id", ensureAdmin, deleteVolunteer);
router.patch("/:id/status", ensureAdmin, updateVolunteerStatus);
export default router;
