import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const login = asyncHandler(async (req, res) => {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password)
        throw new ApiError(400, "All fields are required");

    const user = await User.findOne({ mobileNumber });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) throw new ApiError(401, "Invalid credentials");

    const safeUser = user.toObject();
    delete safeUser.password;

    const token = await user.generateAccessToken();
    if (!token) throw new ApiError(500, "Failed to generate access token");

    const cookiesOption = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    };

    return res
        .status(200)
        .cookie("token", token, cookiesOption)
        .json(
            new ApiResponse(
                200,
                {
                    ...safeUser,
                    token,
                },
                "User logged in"
            )
        );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;
    return res.status(200).json(new ApiResponse(200, user, "User fetched"));
});
export const createAdmin = asyncHandler(async (req, res) => {
    const { name, mobileNumber, password } = req.body;

    if (!name || !mobileNumber || !password)
        throw new ApiError(400, "All fields are required");

    const existing = await User.findOne({ mobileNumber });
    if (existing) throw new ApiError(400, "User already exists");

    const admin = await User.create({
        name,
        mobileNumber,
        password,
        role: "admin",
    });
    return res
        .status(201)
        .json(new ApiResponse(201, admin, "Admin created successfully"));
});

export const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find();
    res.status(200).json(new ApiResponse(200, users, "All users fetched"));
});

export const getAdmins = asyncHandler(async (req, res) => {
    const admins = await User.find({ role: "admin" });
    res.status(200).json(new ApiResponse(200, admins, "All admins fetched"));
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate(
        "volunteer",
        "-password"
    );
    if (!user) throw new ApiError(404, "User not found");
    res.status(200).json(new ApiResponse(200, user, "User fetched"));
});

export const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" });
    res.status(200).json(new ApiResponse(200, {}, "User logged out"));
});
