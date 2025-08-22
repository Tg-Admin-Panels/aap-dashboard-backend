import BoothTeam from "../models/boothTeam.model.js";

// Create a new booth team member
export const createBoothTeamMember = async (req, res) => {
    try {
        const { name, phone, email, boothName, post, padnaam } = req.body;
        const newMember = new BoothTeam({
            name,
            phone,
            email,
            boothName,
            post,
            padnaam,
        });
        await newMember.save();
        res.status(201).json({
            success: true,
            data: newMember,
            message: "Booth team member created successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all booth team members with pagination
export const getAllBoothTeamMembers = async (req, res) => {
    try {
        const { boothName, post, padnaam, page = 1, limit = 10 } = req.query;
        const query = {};

        if (boothName) {
            query.boothName = boothName;
        }

        if (post) {
            query.post = post;
        }

        if (padnaam) {
            query.padnaam = padnaam;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const members = await BoothTeam.find(query)
            .skip(skip)
            .limit(parseInt(limit));

        const totalMembers = await BoothTeam.countDocuments(query);

        res.status(200).json({
            success: true,
            data: members,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalMembers / parseInt(limit)),
            totalMembers,
            message: "All booth team members fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get a single booth team member by ID
export const getBoothTeamMemberById = async (req, res) => {
    try {
        const member = await BoothTeam.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Booth team member not found",
            });
        }
        res.status(200).json({
            success: true,
            data: member,
            message: "Booth team member fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update a booth team member by ID
export const updateBoothTeamMember = async (req, res) => {
    try {
        const updatedMember = await BoothTeam.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!updatedMember) {
            return res.status(404).json({
                success: false,
                message: "Booth team member not found",
            });
        }
        res.status(200).json({
            success: true,
            data: updatedMember,
            message: "Booth team member updated successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete a booth team member by ID
export const deleteBoothTeamMember = async (req, res) => {
    try {
        const deletedMember = await BoothTeam.findByIdAndDelete(req.params.id);
        if (!deletedMember) {
            return res.status(404).json({
                success: false,
                message: "Booth team member not found",
            });
        }
        res.status(200).json({
            success: true,
            data: {},
            message: "Booth team member deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
