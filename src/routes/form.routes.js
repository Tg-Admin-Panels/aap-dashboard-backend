import { Router } from "express";
import {
    createFormDefinition,
    getAllFormDefinitions,
    getFormDefinitionById,
    createFormSubmission,
    getFormSubmissions,
    getSubmissionById,
    deleteFormDefinition,
    bulkCreateSubmissions,
    deleteSubmissionById,
} from "../controllers/form.controller.js";
import { uploadChunk } from "../controllers/upload.controller.js";
import { handleSseConnection } from "../controllers/sse.controller.js";
import { uploadComplete } from "../controllers/uploadComplete.controller.js";

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

router.route("/:formId/submissions/bulk").post(bulkCreateSubmissions);
router.route("/:formId/submissions/upload-chunk").post(uploadChunk);
router.route("/:formId/submissions/events").get(handleSseConnection); // SSE endpoint
router.route("/:formId/submissions/upload-complete").post(uploadComplete); // Upload complete endpoint

// Route for a single submission
router
    .route("/submissions/:submissionId")
    .get(getSubmissionById)
    .delete(deleteSubmissionById);

export default router;
