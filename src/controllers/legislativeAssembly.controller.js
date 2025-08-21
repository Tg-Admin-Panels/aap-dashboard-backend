import LegislativeAssembly from "../models/legislativeAssembly.model.js";

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
