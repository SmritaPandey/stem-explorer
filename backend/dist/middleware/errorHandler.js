"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = void 0;
const zod_1 = require("zod");
const config_1 = __importDefault(require("../config"));
// Custom error class for API errors
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Default error status and message
    let statusCode = 500;
    let message = 'Internal server error';
    let errors = null;
    // Handle specific error types
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation error';
        errors = err.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
        }));
    }
    else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    }
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        errors: errors,
        stack: config_1.default.server.nodeEnv === 'development' ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
