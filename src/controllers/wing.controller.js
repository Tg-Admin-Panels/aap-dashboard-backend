import Wing from "../models/wing.model.js";
import Member from "../models/member.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create new wing
export const createWing = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) throw new ApiError(400, "Wing name is required");

    const existing = await Wing.findOne({ name });
    if (existing) throw new ApiError(400, "Wing already exists");

    const wing = await Wing.create({ name });

    return res
        .status(201)
        .json(new ApiResponse(201, wing, "Wing created successfully"));
});

// Add a leader to a wing
export const addLeader = asyncHandler(async (req, res) => {
    const { wingId } = req.params;
    const { name, post, image, phone } = req.body;

    if (!name || !post || !image || !phone) {
        throw new ApiError(
            400,
            "All fields (name, post, image, phone) are required"
        );
    }

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    if (wing.leader) throw new ApiError(400, "Wing already has a leader");

    const leader = await Member.create({
        name,
        role: "leader",
        post,
        image,
        phone,
        wing: wing._id,
    });

    wing.leader = leader._id;
    await wing.save();

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { wing, leader },
                "Leader added to wing successfully"
            )
        );
});

// Add a member to a wing
export const addMember = asyncHandler(async (req, res) => {
    const { wingId } = req.params;
    const { name, post, image, phone } = req.body;

    if (!name || !post || !image || !phone) {
        throw new ApiError(
            400,
            "All fields (name, post, image, phone) are required"
        );
    }

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    const member = await Member.create({
        name,
        role: "member",
        post,
        image,
        phone,
        wing: wing._id,
    });

    if (!member) throw new ApiError(500, "Failed to create member");

    wing.members.push(member._id);
    await wing.save();

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { wing, member },
                "Member added to wing successfully"
            )
        );
});

// Get all wings with leader and members
export const getAllWings = asyncHandler(async (req, res) => {
    const wings = await Wing.find().populate("leader").populate("members");

    if (!wings) throw new ApiError(404, "No wings found");

    return res
        .status(200)
        .json(new ApiResponse(200, wings, "Fetched all wings successfully"));
});

// Get all members (leader + members) of a specific wing
export const getWingMembers = asyncHandler(async (req, res) => {
    const { wingId } = req.params;

    const wing = await Wing.findById(wingId)
        .populate("leader")
        .populate("members");

    if (!wing) throw new ApiError(404, "Wing not found");

    const result = {
        leader: wing.leader,
        members: wing.members,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(200, result, "Fetched wing members successfully")
        );
});
