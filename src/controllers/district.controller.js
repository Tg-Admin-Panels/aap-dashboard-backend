import District from "../models/district.model.js";

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
