import State from "../models/state.model.js";

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
