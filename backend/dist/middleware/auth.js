"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnership = exports.requireAdmin = exports.optionalAuthenticateJWT = exports.authenticateJWT = void 0;
const passport_1 = __importDefault(require("passport"));
/**
 * Middleware to authenticate requests using JWT
 * This uses passport-jwt strategy configured in passport.ts
 */
const authenticateJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user) => {
        if (err) {
            console.error('JWT authentication error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
/**
 * Middleware to check if user is authenticated
 * This is a lighter version that doesn't return an error, just sets req.user if authenticated
 */
const optionalAuthenticateJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user) => {
        if (user && !err) {
            req.user = user;
        }
        next();
    })(req, res, next);
};
exports.optionalAuthenticateJWT = optionalAuthenticateJWT;
/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware to check if user is accessing their own resource
 * or has admin privileges
 */
const requireOwnership = (userIdParam = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const resourceUserId = parseInt(req.params[userIdParam]);
        if (isNaN(resourceUserId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};
exports.requireOwnership = requireOwnership;
