import Campaign from "../models/campaign.model.js";
import Comment from "../models/comment.model.js";
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

    // Optionally, delete all comments associated with this campaign
    await Comment.deleteMany({ campaign: id });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Campaign deleted successfully"));
});

// Add Comment to Campaign
export const addCommentToCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params; // Campaign ID
    const { text } = req.body;

    if (!text) {
        throw new ApiError(400, "Comment text is required");
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    const comment = await Comment.create({
        campaign: id,
        text,
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// Get Comments for Campaign
export const getCommentsForCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params; // Campaign ID

    const comments = await Comment.find({ campaign: id }).sort({
        createdAt: -1,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// Delete Comment from Campaign
export const deleteCommentFromCampaign = asyncHandler(async (req, res) => {
    const { campaignId, commentId } = req.params;

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        campaign: campaignId,
    });

    if (!comment) {
        throw new ApiError(
            404,
            "Comment not found or does not belong to this campaign"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
});
