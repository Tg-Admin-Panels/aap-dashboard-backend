import District from "../models/district.model.js";
import fs from "fs";
import { parseFile } from "../utils/fileParser.js";

export const createDistrict = async (req, res) => {
    try {
        const newDistrict = new District(req.body);
        await newDistrict.save();
        res.status(201).json({ success: true, data: newDistrict });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllDistricts = async (req, res) => {
    try {
        const { parentId, limit = 100, page = 1 } = req.query;
        const query = parentId ? { parentId } : {};
        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const districts = await District.find(query).limit(limitInt).skip(skip);
        const total = await District.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: districts, 
            pagination: { 
                total,
                page: pageInt,
                limit: limitInt,
                hasNextPage: (skip + districts.length) < total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const bulkUploadDistricts = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
        if (!req.query.parentId) {
            return res.status(400).json({ success: false, message: "parentId is required" });
        }
        const rows = await parseFile(req.file.path);
        const districts = rows.map((row) => ({
            name: row.name,
            code: row.code,
            parentId: req.query.parentId, // must be State _id
        }));

        console.log(districts)
        await District.insertMany(districts, { ordered: false });

        fs.unlinkSync(req.file.path);

        res.status(201).json({ success: true, message: "Districts uploaded successfully", count: districts.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDistrict = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedDistrict = await District.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedDistrict) {
            return res.status(404).json({ success: false, message: "District not found" });
        }
        res.status(200).json({ success: true, data: updatedDistrict });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteDistrict = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDistrict = await District.findByIdAndDelete(id);
        if (!deletedDistrict) {
            return res.status(404).json({ success: false, message: "District not found" });
        }
        res.status(200).json({ success: true, message: "District deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};