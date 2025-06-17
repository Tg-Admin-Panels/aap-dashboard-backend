import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const ensureAuthenticated = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.token ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) throw new ApiError(401, "Unauthorized");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) throw new ApiError(401, "Invalid Access Token");
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});

export const ensureSuperAdmin = asyncHandler(async (req, _, next) => {
    if (req.user.role !== "superadmin") throw new ApiError(403, "Unauthorized");
    next();
});

export const ensureAdmin = asyncHandler(async (req, _, next) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Unauthorized");
    next();
});

export const ensureVolunteer = asyncHandler(async (req, _, next) => {
    if (req.user.role !== "volunteer") throw new ApiError(403, "Unauthorized");
    next();
});

export const ensureWingleader = asyncHandler(async (req, _, next) => {
    if (req.user.role !== "wingleader") throw new ApiError(403, "Unauthorized");
    next();
});
