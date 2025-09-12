import State from "../models/state.model.js";
import fs from "fs";
import { parseFile } from "../utils/fileParser.js";

export const createState = async (req, res) => {
    try {
        const newState = new State(req.body);
        await newState.save();
        res.status(201).json({ success: true, data: newState });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllStates = async (req, res) => {
    try {
        const states = await State.find();
        res.status(200).json({ success: true, data: states });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const bulkUploadStates = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const rows = await parseFile(req.file.path);
        const states = rows.map((row) => ({
            name: row['name'],
            code: row['code'],
        }));

        console.log(rows)
        console.log(Object.keys(rows[0]))
        console.log(states)

        await State.insertMany(states, { ordered: false });

        fs.unlinkSync(req.file.path); // cleanup

        res.status(201).json({ success: true, message: "States uploaded successfully", count: states.length });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
};
