import Volunteer from "../models/volunteer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/coudinary.js";

export const createVolunteer = asyncHandler(async (req, res) => {
    console.log("Create volunteer started", req.body);
    const {
        fullName,
        password,
        dateOfBirth,
        age,
        gender,
        mobileNumber,
        zone,
        district,
        block,
        religion,
        wardNumber,
        boothNumber,
        pinCode,
        postOffice,
        cityName,
        streetOrLocality,
        panchayat,
        villageName,
    } = req.body;

    // Basic required field validations
    if (!fullName) throw new ApiError(400, "Full name is required");
    if (!dateOfBirth) throw new ApiError(400, "Date of birth is required");
    if (!age) throw new ApiError(400, "Age is required");
    if (!gender || !["Male", "Female", "Other"].includes(gender)) {
        throw new ApiError(
            400,
            "Valid gender is required (Male, Female, Other)"
        );
    }
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        throw new ApiError(400, "Valid mobile number is required");
    }
    if(!password) throw new ApiError(400, "Password is required");

    if (!zone || !["Urban", "Rural"].includes(zone)) {
        throw new ApiError(400, "Zone must be either 'Urban' or 'Rural'");
    }
    if (!district) throw new ApiError(400, "District is required");
    if (!block) throw new ApiError(400, "Block is required");

    // Zone-specific validations
    if (zone === "Urban") {
        if (!cityName)
            throw new ApiError(400, "City name is required for Urban zone");
        // if (!streetOrLocality)
        //     throw new ApiError(
        //         400,
        //         "Street or Locality is required for Urban zone"
        //     );
    } else if (zone === "Rural") {
        if (!panchayat)
            throw new ApiError(400, "Panchayat is required for Rural zone");
        if (!villageName)
            throw new ApiError(400, "Village name is required for Rural zone");
    }

    // Check if mobile number already exists
    const existingVolunteer = await Volunteer.findOne({
        mobileNumber: mobileNumber,
    });
    if (existingVolunteer) {
        throw new ApiError(
            400,
            "Volunteer with this mobile number already exists"
        );
    }

    const imagePath = req.file?.path;
    if (!imagePath) throw new ApiError(400, "Image is required");

    const uploadedImage = await uploadOnCloudinary(imagePath);

    if (!uploadedImage) throw new ApiError(500, "Failed to upload image");

    const profilePicture = uploadedImage.secure_url;

    // If all validations pass
    const volunteer = await Volunteer.create({
        fullName,
        dateOfBirth,
        age,
        gender,
        mobileNumber,
        zone,
        district,
        block,
        religion,
        profilePicture,
        wardNumber,
        boothNumber,
        pinCode,
        postOffice,
        cityName,
        streetOrLocality,
        panchayat,
        villageName,
    });

    if(!volunteer) throw new ApiError(500, "Failed to create volunteer");

    const user = await User.create({
        name: fullName,
        mobileNumber: mobileNumber,
        role: "volunteer",
        password,
        volunteer: volunteer._id,
    });

    if (!user) {
        throw new ApiError(500, "Failed to create user");
    }
    
    return res.status(201).json(
        new ApiResponse(201, volunteer, "Volunteer created successfully")
    );
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

export const updateVolunteerStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!volunteer) throw new ApiError(404, "Volunteer not found");

    return res
        .status(200)
        .json(new ApiResponse(200, volunteer, "Status updated"));
});
