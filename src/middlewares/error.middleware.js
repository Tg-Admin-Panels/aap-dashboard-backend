import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

function normalizeMongoError(err) {
    // Duplicate key (e.g., email unique)
    if (
        (err?.name === "MongoServerError" || err?.code) &&
        err?.code === 11000
    ) {
        const fields = Object.keys(err?.keyValue || {});
        const fieldList = fields.length ? fields.join(", ") : "unique field";
        const details = { fields, keyValue: err.keyValue };
        return new ApiError(409, `Duplicate value for ${fieldList}.`, details);
    }

    // Mongoose validation error (schema validators)
    if (err?.name === "ValidationError") {
        const issues = Object.values(err.errors || {}).map((e) => ({
            path: e.path,
            message: e.message,
            kind: e.kind,
            value: e.value,
        }));
        const msg = issues.map((i) => `${i.path}: ${i.message}`).join("; ");
        return new ApiError(400, msg || "Validation failed", { issues });
    }

    // CastError (invalid ObjectId / type casting)
    if (err?.name === "CastError") {
        const details = { path: err.path, value: err.value, kind: err.kind };
        return new ApiError(400, `Invalid ${err.path}: ${err.value}`, details);
    }

    // Document not found when using .orFail()
    if (err?.name === "DocumentNotFoundError") {
        return new ApiError(404, "Document not found");
    }

    // Strict mode / populate errors
    if (
        err?.name === "StrictModeError" ||
        err?.name === "StrictPopulateError"
    ) {
        return new ApiError(400, err.message);
    }

    // Version conflict (optimistic concurrency)
    if (err?.name === "VersionError") {
        return new ApiError(409, "Document version conflict");
    }

    // Bad params passed to Mongoose APIs
    if (err?.name === "ObjectParameterError") {
        return new ApiError(400, err.message);
    }

    // Fallback: if it already looks like an ApiError, pass through
    if (err instanceof ApiError) return err;

    // Generic unknown error
    return new ApiError(
        err?.statusCode || 500,
        err?.message || "Something went wrong",
        {
            originalName: err?.name,
            code: err?.code,
        }
    );
}

export const errorMiddleware = (err, req, res, next) => {
    // Log the raw error (hide stack in prod if you prefer)
    console.error(err);

    // Normalize Mongo/Mongoose errors into a uniform ApiError
    const normalized = normalizeMongoError(err);

    return res.status(normalized.statusCode || 500).json(
        new ApiResponse(
            normalized.statusCode || 500,
            {}, // data
            normalized.message || "Something went wrong",
            // Optional: include details in non-production
            process.env.NODE_ENV === "production"
                ? undefined
                : normalized.details
        )
    );
};
