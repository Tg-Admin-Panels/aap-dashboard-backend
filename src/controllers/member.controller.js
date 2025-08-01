import Member from "../models/member.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import status from "http-status";
import Volunteer from "../models/volunteer.model.js";

// Create Member
export const createMember = asyncHandler(async (req, res) => {
    const { name, state, mobileNumber, joinedBy, volunteerId } = req.body;

    if (!name || !state || !mobileNumber || !joinedBy) {
        throw new ApiError(
            status.BAD_REQUEST,
            "All required fields must be filled"
        );
    }

    if (!["self", "volunteer"].includes(joinedBy)) {
        throw new ApiError(
            status.BAD_REQUEST,
            "joinedBy must be 'self' or 'volunteer'"
        );
    }

    if (joinedBy === "volunteer" && !volunteerId) {
        throw new ApiError(
            status.BAD_REQUEST,
            "volunteerId is required when joinedBy is 'volunteer'"
        );
    }

    if (joinedBy === "volunteer") {
        const volunteer = await Volunteer.findById(volunteerId);
        if (!volunteer) throw new ApiError(404, "Volunteer not found");
    }

    const member = await Member.create({
        name,
        state,
        mobileNumber,
        joinedBy,
        volunteerId: joinedBy === "volunteer" ? volunteerId : undefined,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, member, "Member created successfully"));
});

// Get All Members
export const getAllMembers = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const query = {};

    if (search) {
        const regex = new RegExp(search, "i"); // case-insensitive search

        query.$or = [
            { name: regex },
            { mobileNumber: regex },
            { state: regex },
            // We can't directly search volunteer fields here, but we can filter them after population
        ];
    }

    let members = await Member.find(query).populate(
        "volunteerId",
        "fullName mobileNumber"
    );

    // Optional: Filter by populated volunteer fields manually
    // if (search) {
    //     const regex = new RegExp(search, "i");
    //     members = members.filter(
    //         (member) =>
    //             member.volunteerId &&
    //             (regex.test(member.volunteerId.fullName) ||
    //                 regex.test(member.volunteerId.mobileNumber))
    //     );
    // }

    return res
        .status(200)
        .json(new ApiResponse(200, members, "All members fetched"));
});

// Get Single Member
export const getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await Member.findById(id).populate(
        "volunteerId",
        "fullName mobileNumber"
    );

    if (!member) throw new ApiError(404, "Member not found");

    return res.status(200).json(new ApiResponse(200, member, "Member fetched"));
});

// Get All Members Joined By Self (Website)
export const getMembersJoinedBySelf = asyncHandler(async (req, res) => {
    const members = await Member.find({ joinedBy: "self" });

    return res
        .status(200)
        .json(
            new ApiResponse(200, members, "Members joined via website fetched")
        );
});

// Get All Members Joined By Specific Volunteer
// Get All Members Joined By Specific Volunteer with optional search
export const getMembersByVolunteer = asyncHandler(async (req, res) => {
    const { volunteerId } = req.params;
    const { search } = req.query;

    console.log("query", req.query);

    // Check if the volunteer exists
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) throw new ApiError(404, "Volunteer not found");

    // Build base query
    const query = {
        joinedBy: "volunteer",
        volunteerId,
    };

    // Add search filters if present
    if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
            { name: searchRegex },
            { mobileNumber: searchRegex },
            { state: searchRegex },
        ];
    }

    const members = await Member.find(query).populate(
        "volunteerId",
        "fullName mobileNumber"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, members, "Members joined by volunteer fetched")
        );
});
