import Vision from "../models/vision.model.js";

// @desc    Get all visions
// @route   GET /api/v1/visions
// @access  Public
export const getAllVisions = async (req, res) => {
    try {
        const visions = await Vision.find();
        res.status(200).json({
            success: true,
            data: visions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
};

// @desc    Get a single vision
// @route   GET /api/v1/visions/:id
// @access  Public
export const getVisionById = async (req, res) => {
    try {
        const vision = await Vision.findById(req.params.id);
        if (!vision) {
            return res.status(404).json({
                success: false,
                error: "Vision not found",
            });
        }
        res.status(200).json({
            success: true,
            data: vision,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
};

// @desc    Create a vision
// @route   POST /api/v1/visions
// @access  Private
export const createVision = async (req, res) => {
    try {
        const vision = await Vision.create(req.body);
        res.status(201).json({
            success: true,
            data: vision,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update a vision
// @route   PUT /api/v1/visions/:id
// @access  Private
export const updateVision = async (req, res) => {
    try {
        const vision = await Vision.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!vision) {
            return res.status(404).json({
                success: false,
                error: "Vision not found",
            });
        }
        res.status(200).json({
            success: true,
            data: vision,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete a vision
// @route   DELETE /api/v1/visions/:id
// @access  Private
export const deleteVision = async (req, res) => {
    try {
        const vision = await Vision.findByIdAndDelete(req.params.id);
        if (!vision) {
            return res.status(404).json({
                success: false,
                error: "Vision not found",
            });
        }
        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
};

// @desc    Add a point to a vision
// @route   POST /api/v1/visions/:id/points
// @access  Private
export const addPointToVision = async (req, res) => {
    try {
        const vision = await Vision.findById(req.params.id);
        if (!vision) {
            return res.status(404).json({
                success: false,
                error: "Vision not found",
            });
        }
        vision.points.push(req.body.point);
        await vision.save();
        res.status(200).json({
            success: true,
            data: vision,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Remove a point from a vision
// @route   DELETE /api/v1/visions/:id/points
// @access  Private
export const removePointFromVision = async (req, res) => {
    try {
        const vision = await Vision.findById(req.params.id);
        if (!vision) {
            return res.status(404).json({
                success: false,
                error: "Vision not found",
            });
        }
        vision.points = vision.points.filter(
            (point) => point !== req.body.point
        );
        await vision.save();
        res.status(200).json({
            success: true,
            data: vision,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};
