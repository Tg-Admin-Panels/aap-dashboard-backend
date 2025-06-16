import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const errorMiddleware = (err, req, res, next) => {
    console.log(err);
    return res
        .status(err?.statusCode || 500)
        .json(
            new ApiResponse(
                err?.statusCode || 500,
                {},
                err?.message || "Something went wrong"
            )
        );
};
