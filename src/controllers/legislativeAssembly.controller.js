import LegislativeAssembly from "../models/legislativeAssembly.model.js";

import fs from "fs";
import { parseFile } from "../utils/fileParser.js";

export const createLegislativeAssembly = async (req, res) => {
    try {
        const newLegislativeAssembly = new LegislativeAssembly(req.body);
        await newLegislativeAssembly.save();
        res.status(201).json({ success: true, data: newLegislativeAssembly });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllLegislativeAssemblies = async (req, res) => {
    try {
        const { parentId } = req.query;
        const query = parentId ? { parentId } : {};
        const legislativeAssemblies = await LegislativeAssembly.find(query);
        res.status(200).json({ success: true, data: legislativeAssemblies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const bulkUploadLegislativeAssemblies = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        if (!req.query.parentId) {
            return res.status(400).json({ success: false, message: "parentId is required" });
        }

        // Parse CSV/XLSX file into JSON
        const rows = await parseFile(req.file.path);

        // Map rows into documents
        const assemblies = rows.map((row) => ({
            name: row.name?.trim(),
            code: row.code?.trim(),
            parentId: req.query.parentId, // must be District _id
        }));

        // Insert many at once
        await LegislativeAssembly.insertMany(assemblies, { ordered: false });

        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            success: true,
            message: "Legislative Assemblies uploaded successfully",
            count: assemblies.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};