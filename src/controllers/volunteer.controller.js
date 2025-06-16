import Volunteer from "../models/volunteer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// CREATE
export const createVolunteer = asyncHandler(async (req, res) => {
    const volunteer = await Volunteer.create(req.body);
    res.status(201).json(new ApiResponse(201, volunteer, "Volunteer created"));
});

// READ ALL
export const getAllVolunteers = asyncHandler(async (req, res) => {
    const volunteers = await Volunteer.find();
    res.status(200).json(
        new ApiResponse(200, volunteers, "All volunteers fetched")
    );
});

// READ ONE
export const getVolunteerById = asyncHandler(async (req, res) => {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer)
        return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json(new ApiResponse(200, volunteer, "Volunteer fetched"));
});

// UPDATE
export const updateVolunteer = asyncHandler(async (req, res) => {
    const updatedVolunteer = await Volunteer.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );
    if (!updatedVolunteer)
        return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json(
        new ApiResponse(200, updatedVolunteer, "Volunteer updated")
    );
});

// DELETE
export const deleteVolunteer = asyncHandler(async (req, res) => {
    const deleted = await Volunteer.findByIdAndDelete(req.params.id);
    if (!deleted)
        return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json(new ApiResponse(200, null, "Volunteer deleted"));
});
