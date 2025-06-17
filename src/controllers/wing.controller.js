import User from "../models/user.model.js";
import Wing from "../models/wing.model.js";
import WingMember from "../models/wingmember.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/coudinary.js";

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
    const { name, post, phone } = req.body;

    console.log("add leader started")
    
    if (!name || !post || !phone) {
        throw new ApiError(
            400,
            "All fields are required"
        );
    }

    const imagePath = req.file?.path;
    if (!imagePath) throw new ApiError(400, "image is required");

    const uploadedImage = await uploadOnCloudinary(imagePath);

    if (!uploadedImage) throw new ApiError(500, "Failed to upload image");

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    if (wing.leader) throw new ApiError(400, "Wing already has a leader");

    console.log("leader added");
    const leader = await WingMember.create({
        name,
        role: "leader",
        post,
        image: uploadedImage.secure_url,
        phone,
        wing: wing._id,
    });

    wing.leader = leader._id;
    await wing.save();

    // const user = await User.findOneAndUpdate(
    //     { mobileNumber: phone },
    //     {
    //         $set: {
    //             name,
    //             mobileNumber: phone,
    //             role: "wingleader",
    //             wing: wing._id,
    //         },
    //     },
    //     { upsert: true, new: true }
    // );

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

export const getAllLeaders = asyncHandler(async (req, res) => {
    const leaders = await WingMember.find({ role: "leader" });
    res.status(200).json(new ApiResponse(200, leaders, "All leaders fetched"));
});

// Add a member to a wing
export const addMember = asyncHandler(async (req, res) => {
    const { wingId } = req.params;
    const { name, post, phone } = req.body;

    // if(wingM)
    if (!name || !post || !phone) {
        throw new ApiError(
            400,
            "All fields (name, post, image, phone) are required"
        );
    }

    const imagePath = req.files?.image[0]?.path;
    if (!imagePath) return new ApiError("image is required");

    const uploadedImage = await uploadOnCloudinary(imagePath);

    if (!uploadedImage) throw new ApiError("Failed to upload image");

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    const member = await WingMember.create({
        name,
        role: "member",
        post,
        image: uploadedImage.secure_url,
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

export const getAllWingMembers = asyncHandler(async (req, res) => {
    const allMembers = await WingMember.find({});

    if (!allMembers) throw new ApiError("Failed to fetch wing members.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allMembers,
                "All wing members fetched successfully."
            )
        );
});
