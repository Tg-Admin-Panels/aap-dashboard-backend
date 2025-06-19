import Member from "../models/member.model.js";
import Volunteer from "../models/volunteer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// GET /api/dashboard/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const monthsBack = (n) =>
        new Date(now.getFullYear(), now.getMonth() - n, 1);

    // 1. Member & Volunteer Growth (Last 6 Months)
    const lastSixMonths = Array.from({ length: 12 }, (_, i) => {
        const date = monthsBack(11 - i);
        return {
            label: date.toLocaleString("default", { month: "short" }),
            date,
        };
    });

    const memberGrowth = await Promise.all(
        lastSixMonths.map(({ date }, i) => {
            const nextMonth = new Date(date);
            nextMonth.setMonth(date.getMonth() + 1);
            return Member.countDocuments({
                createdAt: { $gte: date, $lt: nextMonth },
            });
        })
    );

    const volunteerGrowth = await Promise.all(
        lastSixMonths.map(({ date }, i) => {
            const nextMonth = new Date(date);
            nextMonth.setMonth(date.getMonth() + 1);
            return Volunteer.countDocuments({
                createdAt: { $gte: date, $lt: nextMonth },
            });
        })
    );

    // 2. Distribution by State
    const stateStats = await Member.aggregate([
        { $group: { _id: "$state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    // 3. Gender Distribution (from volunteers)
    const genderStats = await Volunteer.aggregate([
        { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // 4. Joined By Source (self or volunteer)
    const joinTypeStats = await Member.aggregate([
        { $group: { _id: "$joinedBy", count: { $sum: 1 } } },
    ]);

    // 5. Top Volunteers (by member count)
    const topVolunteers = await Member.aggregate([
        { $match: { joinedBy: "volunteer" } },
        {
            $group: {
                _id: "$volunteerId",
                membersCount: { $sum: 1 },
            },
        },
        { $sort: { membersCount: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "volunteers",
                localField: "_id",
                foreignField: "_id",
                as: "volunteer",
            },
        },
        {
            $unwind: "$volunteer",
        },
        {
            $project: {
                fullName: "$volunteer.fullName",
                mobileNumber: "$volunteer.mobileNumber",
                membersCount: 1,
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            growth: {
                months: lastSixMonths.map((m) => m.label),
                members: memberGrowth,
                volunteers: volunteerGrowth,
            },
            stateDistribution: stateStats,
            genderDistribution: genderStats,
            joinSources: joinTypeStats,
            topVolunteers,
        })
    );
});
