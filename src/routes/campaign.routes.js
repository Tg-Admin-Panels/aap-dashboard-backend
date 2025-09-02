import express from "express";
import {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    addFeedbackFormToCampaign,
    getFeedbackFormsForCampaign,
    deleteFeedbackFormFromCampaign,
    getFeedbackFormById,
} from "../controllers/campaign.controller.js";
import {
    ensureAdmin,
    ensureAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Campaign routes
router
    .route("/")
    .post(ensureAuthenticated, ensureAdmin, createCampaign)
    .get(getAllCampaigns);
router
    .route("/:id")
    .get(getCampaignById)
    .put(ensureAuthenticated, ensureAdmin, updateCampaign)
    .delete(ensureAuthenticated, ensureAdmin, deleteCampaign);

// Feedback Form routes
router
    .route("/:id/feedback-forms")
    .post(addFeedbackFormToCampaign)
    .get(getFeedbackFormsForCampaign);
router.delete(
    "/:campaignId/feedback-forms/:feedbackFormId",
    ensureAuthenticated,
    ensureAdmin,
    deleteFeedbackFormFromCampaign
);
router
    .route("/:campaignId/feedback-forms/:feedbackFormId")
    .get(getFeedbackFormById);

export default router;
