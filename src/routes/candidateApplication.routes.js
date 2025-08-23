import express from "express";
import {
    createCandidateApplication,
    getAllCandidateApplications,
    getCandidateApplicationById,
    updateCandidateApplication,
    deleteCandidateApplication,
    updateCandidateApplicationStatus,
} from "../controllers/candidateApplication.controller.js";
import {
    ensureAdmin,
    ensureAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", createCandidateApplication);

router.use(ensureAuthenticated);

router.get("/", ensureAdmin, getAllCandidateApplications);
router.get("/:id", ensureAdmin, getCandidateApplicationById);
router.put("/:id", ensureAdmin, updateCandidateApplication);
router.delete("/:id", ensureAdmin, deleteCandidateApplication);
router.patch("/:id/status", ensureAdmin, updateCandidateApplicationStatus);

export default router;
