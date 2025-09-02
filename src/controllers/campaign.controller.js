import Campaign from "../models/campaign.model.js";
import FeedbackForm from "../models/FeedbackForm.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// Create Campaign
export const createCampaign = asyncHandler(async (req, res) => {
    const { title, description, bannerImage } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const campaign = await Campaign.create({
        title,
        description,
        bannerImage,
    });

    if (!campaign) {
        throw new ApiError(500, "Failed to create campaign");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, campaign, "Campaign created successfully"));
});

// Get All Campaigns
export const getAllCampaigns = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const query = {};
    if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const campaigns = await Campaign.find(query);

    return res
        .status(200)
        .json(
            new ApiResponse(200, campaigns, "Campaigns fetched successfully")
        );
});

// Get Campaign by ID
export const getCampaignById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, campaign, "Campaign fetched successfully"));
});

// Update Campaign
export const updateCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, bannerImage } = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
        id,
        { title, description, bannerImage },
        { new: true, runValidators: true }
    );

    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, campaign, "Campaign updated successfully"));
});

// Delete Campaign
export const deleteCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    // Delete all feedback forms associated with this campaign
    await FeedbackForm.deleteMany({ campaign: id });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Campaign deleted successfully"));
});

// Add Feedback Form to Campaign
export const addFeedbackFormToCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params; // Campaign ID
    const { name, mobile, state, district, vidhansabha, support } = req.body;

    if (!name || !mobile || !state || !district || !vidhansabha) {
        throw new ApiError(
            400,
            "All required feedback form fields are missing"
        );
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    const feedbackForm = await FeedbackForm.create({
        campaign: id,
        name,
        mobile,
        state,
        district,
        vidhansabha,
        support: support || false, // Default to false if not provided
    });

    if (!feedbackForm) {
        throw new ApiError(500, "Failed to add feedback form");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                feedbackForm,
                "Feedback form added successfully"
            )
        );
});

// Get Feedback Forms for Campaign
export const getFeedbackFormsForCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params; // Campaign ID

    const feedbackForms = await FeedbackForm.find({ campaign: id }).sort({
        createdAt: -1,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                feedbackForms,
                "Feedback forms fetched successfully"
            )
        );
});

// Get Single Feedback Form by ID
export const getFeedbackFormById = asyncHandler(async (req, res) => {
    const { campaignId, feedbackFormId } = req.params;

    const feedbackForm = await FeedbackForm.findOne({
        _id: feedbackFormId,
        campaign: campaignId,
    });

    if (!feedbackForm) {
        throw new ApiError(
            404,
            "Feedback form not found or does not belong to this campaign"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                feedbackForm,
                "Feedback form fetched successfully"
            )
        );
});

// Delete Feedback Form from Campaign
export const deleteFeedbackFormFromCampaign = asyncHandler(async (req, res) => {
    const { campaignId, feedbackFormId } = req.params;

    const feedbackForm = await FeedbackForm.findOneAndDelete({
        _id: feedbackFormId,
        campaign: campaignId,
    });

    if (!feedbackForm) {
        throw new ApiError(
            404,
            "Feedback form not found or does not belong to this campaign"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Feedback form deleted successfully"));
});
