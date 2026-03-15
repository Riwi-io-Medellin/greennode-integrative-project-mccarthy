export function successResponse(res, message, data = null, statusCode = 200, extra = {}) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...extra
    });
}

export function errorResponse(res, message, statusCode = 400, errors = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        errors
    });
}