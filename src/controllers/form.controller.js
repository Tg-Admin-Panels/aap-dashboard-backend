import { FormDefinition } from "../models/formDefinition.model.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable, PassThrough } from 'stream';
import * as Papa from "papaparse";
import ExcelJS from 'exceljs';

const uploadSessions = new Map(); // Stores { headers, partialRow, fileType, tempFilePath, totalRowsProcessed, headersValidated } per session

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new form definition
// @route   POST /api/v1/forms
// @access  Private
const createFormDefinition = asyncHandler(async (req, res) => {
    const { formName, fields } = req.body;

    if (!formName || !fields || !Array.isArray(fields) || fields.length === 0) {
        throw new ApiError(
            400,
            "Form name and at least one field are required."
        );
    }

    const existingForm = await FormDefinition.findOne({ formName });
    if (existingForm) {
        throw new ApiError(
            409,
            `A form with the name '${formName}' already exists.`
        );
    }

    const form = await FormDefinition.create({ formName, fields });

    return res
        .status(201)
        .json(
            new ApiResponse(201, form, "Form definition created successfully.")
        );
});

// @desc    Get all form definitions
// @route   GET /api/v1/forms
// @access  Public
const getAllFormDefinitions = asyncHandler(async (req, res) => {
    const forms = await FormDefinition.find({}).select("formName _id");
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                forms,
                "Form definitions retrieved successfully."
            )
        );
});

// @desc    Get a single form definition by ID
// @route   GET /api/v1/forms/:formId
// @access  Public
const getFormDefinitionById = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const form = await FormDefinition.findById(formId);

    if (!form) {
        throw new ApiError(404, "Form definition not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                form,
                "Form definition retrieved successfully."
            )
        );
});

// @desc    Create a new form submission
// @route   POST /api/v1/forms/:formId/submissions
// @access  Public
const createFormSubmission = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const submissionData = req.body;

    if (!submissionData || Object.keys(submissionData).length === 0) {
        throw new ApiError(400, "Submission data cannot be empty.");
    }

    const formDef = await FormDefinition.findById(formId);
    if (!formDef) {
        throw new ApiError(404, "Form definition not found.");
    }

    // Optional: Validate submissionData against formDef.fields here

    const submission = await FormSubmission.create({
        formId,
        data: submissionData,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, submission, "Form submitted successfully."));
});

// @desc    Get all submissions for a form
// @route   GET /api/v1/forms/:formId/submissions
// @access  Public
const getFormSubmissions = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const formDef = await FormDefinition.findById(formId);
    if (!formDef) {
        throw new ApiError(404, "Form definition not found.");
    }

    const submissions = await FormSubmission.find({ formId })
        // .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalSubmissions = await FormSubmission.countDocuments({ formId });
    const totalPages = Math.ceil(totalSubmissions / limit);

    const response = {
        formDefinition: formDef,
        submissions: submissions,
        pagination: {
            totalDocs: totalSubmissions,
            limit: limit,
            page: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            nextPage: page < totalPages ? page + 1 : null,
            hasPrevPage: page > 1,
            prevPage: page > 1 ? page - 1 : null,
        },
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "Submissions retrieved successfully. prem"
            )
        );
});

// @desc    Get a single submission by ID
// @route   GET /api/v1/submissions/:submissionId
// @access  Public
const getSubmissionById = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;

    const submission =
        await FormSubmission.findById(submissionId).populate("formId");

    if (!submission) {
        throw new ApiError(404, "Submission not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                submission,
                "Submission retrieved successfully."
            )
        );
});

const deleteFormDefinition = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { keepSubmissions } = req.query;
    const form = await FormDefinition.findByIdAndDelete(formId);

    if (!form) {
        throw new ApiError(404, "Form definition not found.");
    }

    if (keepSubmissions !== "true") {
        // Also delete all submissions associated with this form
        await FormSubmission.deleteMany({ formId });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Form definition and associated submissions deleted successfully."
            )
        );
});

// @desc    Create multiple form submissions in bulk
// @route   POST /api/v1/forms/:formId/submissions/bulk
// @access  Private
const bulkCreateSubmissions = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { submissions } = req.body;

    if (
        !submissions ||
        !Array.isArray(submissions) ||
        submissions.length === 0
    ) {
        throw new ApiError(400, "Submissions array cannot be empty.");
    }

    const formDef = await FormDefinition.findById(formId);
    if (!formDef) {
        throw new ApiError(404, "Form definition not found.");
    }

    // Optional: Add more robust validation against formDef.fields here

    const submissionsToInsert = submissions.map((sub) => ({
        formId: formId,
        data: sub.data,
    }));

    const createdSubmissions =
        await FormSubmission.insertMany(submissionsToInsert);

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { count: createdSubmissions.length },
                "Submissions created successfully."
            )
        );
});

// @desc    Delete a single submission by ID
// @route   DELETE /api/v1/forms/submissions/:submissionId
// @access  Private
const deleteSubmissionById = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;

    const submission = await FormSubmission.findByIdAndDelete(submissionId);

    if (!submission) {
        throw new ApiError(404, "Submission not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Submission deleted successfully."));
});



export {
    createFormDefinition,
    getAllFormDefinitions,
    getFormDefinitionById,
    createFormSubmission,
    getFormSubmissions,
    getSubmissionById,
    deleteFormDefinition,
    bulkCreateSubmissions,
    deleteSubmissionById,
};
