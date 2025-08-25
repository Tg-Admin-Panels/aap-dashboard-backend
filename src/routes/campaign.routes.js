import express from "express";
import {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    addCommentToCampaign,
    getCommentsForCampaign,
    deleteCommentFromCampaign,
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

// Comment routes
router
    .route("/:id/comments")
    .post(addCommentToCampaign)
    .get(getCommentsForCampaign);
router.delete(
    "/:campaignId/comments/:commentId",
    ensureAuthenticated,
    ensureAdmin,
    deleteCommentFromCampaign
);

export default router;
