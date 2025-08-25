import CandidateApplication from "../models/candidateApplication.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const createCandidateApplication = asyncHandler(async (req, res) => {
    const {
        applicantName,
        state,
        district,
        legislativeAssembly,
        mobile,
        address,
        harGharJhandaCount,
        janAakroshMeetingsCount,
        communityMeetingsCount,
        facebookFollowers,
        facebookPageLink,
        instagramFollowers,
        instagramLink,
        biodataPdfUrl,
        biodataPdfPublicId,
    } = req.body;

    if (!applicantName) throw new ApiError(400, "Applicant name is required");
    if (!district) throw new ApiError(400, "District is required");
    if (!legislativeAssembly)
        throw new ApiError(400, "Legislative Assembly is required");
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        throw new ApiError(400, "Valid mobile number is required");
    }
    if (!address) throw new ApiError(400, "Address is required");
    if (harGharJhandaCount === undefined)
        throw new ApiError(400, "Count for 'Har Ghar Jhanda' is required");
    if (janAakroshMeetingsCount === undefined)
        throw new ApiError(400, "Count for 'Jan Aakrosh meetings' is required");
    if (communityMeetingsCount === undefined)
        throw new ApiError(400, "Count for 'Community meetings' is required");
    if (facebookFollowers === undefined)
        throw new ApiError(400, "Facebook followers count is required");
    if (!facebookPageLink)
        throw new ApiError(400, "Facebook page link is required");
    if (instagramFollowers === undefined)
        throw new ApiError(400, "Instagram followers count is required");
    if (!instagramLink) throw new ApiError(400, "Instagram link is required");
    if (!biodataPdfUrl) throw new ApiError(400, "Biodata PDF is required");

    const existingApplication = await CandidateApplication.findOne({ mobile });
    if (existingApplication) {
        throw new ApiError(
            400,
            "An application with this mobile number already exists"
        );
    }

    const application = await CandidateApplication.create({
        applicantName,
        state,
        district,
        legislativeAssembly,
        mobile,
        address,
        harGharJhandaCount,
        janAakroshMeetingsCount,
        communityMeetingsCount,
        facebookFollowers,
        facebookPageLink,
        instagramFollowers,
        instagramLink,
        biodataPdfUrl,
        biodataPdfPublicId,
    });

    if (!application)
        throw new ApiError(500, "Failed to create candidate application");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                application,
                "Candidate application created successfully"
            )
        );
});

export const getAllCandidateApplications = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const query = {};
    if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [{ applicantName: searchRegex }, { mobile: searchRegex }];
    }

    const applications = await CandidateApplication.find(query)
        .populate("state", "name")
        .populate("district", "name")
        .populate("legislativeAssembly", "name");

    res.status(200).json(
        new ApiResponse(
            200,
            applications,
            "Candidate applications fetched successfully"
        )
    );
});

export const getCandidateApplicationById = asyncHandler(async (req, res) => {
    const application = await CandidateApplication.findById(req.params.id)
        .populate("state", "name")
        .populate("district", "name")
        .populate("legislativeAssembly", "name");
    if (!application)
        return res
            .status(404)
            .json({ message: "Candidate application not found" });
    res.status(200).json(
        new ApiResponse(200, application, "Candidate application fetched")
    );
});

export const updateCandidateApplication = asyncHandler(async (req, res) => {
    const updatedApplication = await CandidateApplication.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );
    if (!updatedApplication)
        return res
            .status(404)
            .json({ message: "Candidate application not found" });
    res.status(200).json(
        new ApiResponse(
            200,
            updatedApplication,
            "Candidate application updated"
        )
    );
});

export const deleteCandidateApplication = asyncHandler(async (req, res) => {
    const deleted = await CandidateApplication.findByIdAndDelete(req.params.id);
    if (!deleted)
        return res
            .status(404)
            .json({ message: "Candidate application not found" });
    res.status(200).json(
        new ApiResponse(200, null, "Candidate application deleted")
    );
});

export const updateCandidateApplicationStatus = asyncHandler(
    async (req, res) => {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!["pending", "approved", "rejected"].includes(status)) {
            throw new ApiError(400, "Invalid status");
        }

        const application = await CandidateApplication.findByIdAndUpdate(
            id,
            { status, notes },
            { new: true }
        )
            .populate("state", "name")
            .populate("district", "name")
            .populate("legislativeAssembly", "name");

        if (!application)
            throw new ApiError(404, "Candidate application not found");

        return res
            .status(200)
            .json(new ApiResponse(200, application, "Status updated"));
    }
);
