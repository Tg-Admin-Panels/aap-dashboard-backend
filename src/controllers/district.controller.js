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
        const { parentId } = req.query;
        const query = parentId ? { parentId } : {};
        const districts = await District.find(query);
        res.status(200).json({ success: true, data: districts });
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