import { Router } from "express";
import {
    createFormDefinition,
    getAllFormDefinitions,
    getFormDefinitionById,
    createFormSubmission,
    getFormSubmissions,
    getSubmissionById,
    deleteFormDefinition,
} from "../controllers/form.controller.js";

const router = Router();

// Form Definition Routes
router.route("/").post(createFormDefinition).get(getAllFormDefinitions);

router
    .route("/:formId")
    .get(getFormDefinitionById)
    .delete(deleteFormDefinition);

// Form Submission Routes
router
    .route("/:formId/submissions")
    .post(createFormSubmission)
    .get(getFormSubmissions);

// Route for a single submission
router.route("/submissions/:submissionId").get(getSubmissionById);

export default router;
