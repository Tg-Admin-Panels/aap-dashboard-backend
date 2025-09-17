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
        const { parentId, limit = 100, page = 1 } = req.query;
        const query = parentId ? { parentId } : {};
        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const legislativeAssemblies = await LegislativeAssembly.find(query).limit(limitInt).skip(skip);
        const total = await LegislativeAssembly.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: legislativeAssemblies, 
            pagination: { 
                total,
                page: pageInt,
                limit: limitInt,
                hasNextPage: (skip + legislativeAssemblies.length) < total
            }
        });
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

export const updateLegislativeAssembly = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAssembly = await LegislativeAssembly.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedAssembly) {
            return res.status(404).json({ success: false, message: "Legislative Assembly not found" });
        }
        res.status(200).json({ success: true, data: updatedAssembly });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteLegislativeAssembly = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAssembly = await LegislativeAssembly.findByIdAndDelete(id);
        if (!deletedAssembly) {
            return res.status(404).json({ success: false, message: "Legislative Assembly not found" });
        }
        res.status(200).json({ success: true, message: "Legislative Assembly deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};