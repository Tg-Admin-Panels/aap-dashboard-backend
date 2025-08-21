import Booth from "../models/booth.model.js";

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
