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

    console.log("add leader started");

    if (!name || !post || !phone) {
        throw new ApiError(400, "All fields are required");
    }

    const imagePath = req.file?.path;
    if (!imagePath) throw new ApiError(400, "image is required");

    const uploadedImage = await uploadOnCloudinary(imagePath);

    if (!uploadedImage) throw new ApiError(500, "Failed to upload image");

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    if (wing.leader) throw new ApiError(400, "Wing already has a leader");

    console.log("leader added");
    // checking wing member is not a member of that wing already
    const member = await WingMember.findOne({ phone });
    if (member) {
        throw new ApiError(404, `Member already exit as ${member.role}`);
    }
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

// change wing leader
export const changeLeader = asyncHandler(async (req, res) => {
    const { wingId } = req.params;
    const { name, post, phone, memberId } = req.body;

    if (!memberId && (!name || !post || !phone)) {
        throw new ApiError(400, "All fields are required");
    }

    const wing = await Wing.findById(wingId).populate('members');
    if (!wing) throw new ApiError(404, "Wing not found");

    // If there is an existing leader, demote them to 'member'
    if (wing.leader) {
        const currentLeader = await WingMember.findById(wing.leader);
        if (currentLeader) {
            currentLeader.role = "member";
            await currentLeader.save();
            wing.members.push(currentLeader);
        }
    }

    let newLeader;

    if (memberId) {
        // Promote existing member to leader
        newLeader = await WingMember.findById(memberId);
        if (!newLeader) throw new ApiError(404, "Selected member not found");

        newLeader.role = "leader";
        await newLeader.save();
        wing.members = wing.members.filter(l => String(l._id) !== String(memberId));
    } else {
        // Create new leader
        let uploadedImageUrl = "";

        const imagePath = req.file?.path;
        if (imagePath) {
            const uploadedImage = await uploadOnCloudinary(imagePath);
            if (!uploadedImage) throw new ApiError(500, "Image upload failed");
            uploadedImageUrl = uploadedImage.secure_url;
        } else {
            throw new ApiError(400, "Image is required for new leader");
        }

        newLeader = await WingMember.create({
            name,
            phone,
            post,
            image: uploadedImageUrl,
            role: "leader",
            wing: wing._id,
        });
    }

    // Update wing with new leader
    wing.leader = newLeader._id;
    await wing.save();
    console.log(wing.members)
    return res
        .status(200)
        .json(new ApiResponse(200, { leader: newLeader, members: wing.members }, "Leader updated successfully"));
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

    const imagePath = req.file?.path;
    if (!imagePath) return new ApiError("image is required");

    const uploadedImage = await uploadOnCloudinary(imagePath);

    if (!uploadedImage) throw new ApiError("Failed to upload image");

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    const isMemberExist = await WingMember.findOne({ phone });
    if (isMemberExist) {
        throw new ApiError(404, `Member already exit as ${isMemberExist.role}`);
    }
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

export const updateMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { name, post, phone } = req.body;

    console.log("Update member started");
    const member = await WingMember.findById(memberId);
    if (!member) throw new ApiError(404, "Wing member not found");

    const updateFields = {};

    if (name) updateFields.name = name;
    if (post) updateFields.post = post;
    if (phone) updateFields.phone = phone;

    console.log("Before updload");
    // Handle optional image update
    const imagePath = req.file?.path;
    if (imagePath) {
        const uploadedImage = await uploadOnCloudinary(imagePath);
        if (!uploadedImage) throw new ApiError(500, "Failed to upload image");
        updateFields.image = uploadedImage.secure_url;
        console.log("After upload");
    }

    // Apply the updates
    Object.assign(member, updateFields);
    await member.save();

    console.log("Member updated successfully");
    return res
        .status(200)
        .json(new ApiResponse(200, member, "Member updated successfully"));
});

// Get all wings with leader and members
export const getAllWings = asyncHandler(async (req, res) => {
    const wings = await Wing.find().populate("leader").populate("members").sort({
        createdAt: -1
    });

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

export const deleteWingMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await WingMember.findById(memberId);
    if (!member) throw new ApiError(404, "Wing member not found");

    const wing = await Wing.findById(member.wing);

    if (wing)
        wing.members = wing.members.filter((id) => id.toString() !== memberId);

    await wing.save();
    await member.remove();

    return res
        .status(200)
        .json(new ApiResponse(200, member, "Wing member deleted successfully"));
});

export const deleteWing = asyncHandler(async (req, res) => {
    const { wingId } = req.params;

    const wing = await Wing.findById(wingId);
    if (!wing) throw new ApiError(404, "Wing not found");

    await wing.remove();

    return res
        .status(200)
        .json(new ApiResponse(200, wing, "Wing deleted successfully"));
});
