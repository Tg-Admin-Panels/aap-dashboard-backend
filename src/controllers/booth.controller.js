import Booth from "../models/booth.model.js";
import { parseFile } from "../utils/fileParser.js";
import fs from "fs";
export const createBooth = async (req, res) => {
    try {
        const newBooth = new Booth(req.body);
        await newBooth.save();
        res.status(201).json({ success: true, data: newBooth });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllBooths = async (req, res) => {
    try {
        const { parentId, limit = 100, page = 1 } = req.query;
        const query = parentId ? { parentId } : {};
        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const booths = await Booth.find(query).limit(limitInt).skip(skip);
        const total = await Booth.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: booths, 
            pagination: { 
                total,
                page: pageInt,
                limit: limitInt,
                hasNextPage: (skip + booths.length) < total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const bulkUploadBooths = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        if (!req.query.parentId) {
            return res.status(400).json({ success: false, message: "parentId is required" });
        }

        // Parse CSV/XLSX file
        const rows = await parseFile(req.file.path);

        // Clean + map rows
        const booths = rows.map((row) => ({
            name: row.name?.trim(),
            code: row.code?.trim(),
            parentId: req.query.parentId, // LegislativeAssembly _id
        }));

        // Insert into DB
        await Booth.insertMany(booths, { ordered: false });

        // Remove temp file
        fs.unlink(req.file.path, () => { });

        res.status(201).json({
            success: true,
            message: "Booths uploaded successfully",
            count: booths.length,
            jobId: req.jobId, // अगर आपने jobId middleware लगाया है
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBooth = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBooth = await Booth.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBooth) {
            return res.status(404).json({ success: false, message: "Booth not found" });
        }
        res.status(200).json({ success: true, data: updatedBooth });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteBooth = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBooth = await Booth.findByIdAndDelete(id);
        if (!deletedBooth) {
            return res.status(404).json({ success: false, message: "Booth not found" });
        }
        res.status(200).json({ success: true, message: "Booth deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};