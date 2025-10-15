import Member from "../models/member.model.js";
import Volunteer from "../models/volunteer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// GET /api/dashboard/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
    const { period = "monthly" } = req.query; // "monthly" | "weekly" | "yearly"
    const now = new Date();

    // Helper to go back in time
    const monthsBack = (n) => new Date(now.getFullYear(), now.getMonth() - n, 1);
    const weeksBack = (n) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n * 7);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    const yearsBack = (n) => new Date(now.getFullYear() - n, 0, 1);

    // -----------------------------
    // 1 Generate Period Labels
    // -----------------------------
    let timeline = [];

    if (period === "weekly") {
        timeline = Array.from({ length: 12 }, (_, i) => {
            const date = weeksBack(11 - i);
            return {
                label: `Week ${i + 1}`,
                start: date,
                end: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
            };
        });
    } else if (period === "yearly") {
        timeline = Array.from({ length: 5 }, (_, i) => {
            const start = yearsBack(4 - i);
            const end = new Date(start.getFullYear() + 1, 0, 1);
            return {
                label: start.getFullYear().toString(),
                start,
                end,
            };
        });
    } else {
        // default: monthly (last 12 months)
        timeline = Array.from({ length: 12 }, (_, i) => {
            const start = monthsBack(11 - i);
            const end = new Date(start);
            end.setMonth(start.getMonth() + 1);
            return {
                label: start.toLocaleString("default", { month: "short" }),
                start,
                end,
            };
        });
    }

    // -----------------------------
    // 2 Growth Data
    // -----------------------------
    const memberGrowth = await Promise.all(
        timeline.map(({ start, end }) =>
            Member.countDocuments({
                createdAt: { $gte: start, $lt: end },
            })
        )
    );

    const volunteerGrowth = await Promise.all(
        timeline.map(({ start, end }) =>
            Volunteer.countDocuments({
                createdAt: { $gte: start, $lt: end },
            })
        )
    );

    // -----------------------------
    // 3 State Distribution (Members)
    // -----------------------------
    const stateStats = await Member.aggregate([
        { $group: { _id: "$state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    // -----------------------------
    // 4 Gender Distribution (Volunteers)
    // -----------------------------
    const genderStats = await Volunteer.aggregate([
        { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // -----------------------------
    // 5 Join Type Distribution (Members)
    // -----------------------------
    const joinTypeStats = await Member.aggregate([
        { $group: { _id: "$joinedBy", count: { $sum: 1 } } },
    ]);

    // -----------------------------
    // 6 Top Volunteers (Members Added)
    // -----------------------------
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
        { $unwind: "$volunteer" },
        {
            $project: {
                fullName: "$volunteer.fullName",
                mobileNumber: "$volunteer.mobileNumber",
                membersCount: 1,
            },
        },
    ]);

    // -----------------------------
    // 7 Final Response
    // -----------------------------
    res.status(200).json(
        new ApiResponse(200, {
            filter: period,
            growth: {
                timeline: timeline.map((t) => t.label),
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

