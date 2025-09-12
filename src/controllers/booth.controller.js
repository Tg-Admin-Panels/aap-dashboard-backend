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
        const { parentId } = req.query;
        const query = parentId ? { parentId } : {};
        const booths = await Booth.find(query);
        res.status(200).json({ success: true, data: booths });
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