"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.storeRefreshToken = storeRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeAllUserRefreshTokens = revokeAllUserRefreshTokens;
exports.generateTokens = generateTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../db"));
const config_1 = __importDefault(require("../config"));
/**
 * Generate JWT access token
 */
function generateAccessToken(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
    };
    return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
        expiresIn: config_1.default.jwt.accessExpiresIn,
        issuer: config_1.default.jwt.issuer,
        audience: config_1.default.jwt.audience,
        jwtid: (0, uuid_1.v4)(),
    });
}
/**
 * Generate JWT refresh token
 */
function generateRefreshToken(user) {
    const payload = {
        sub: user.id,
        type: 'refresh',
    };
    return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
        expiresIn: config_1.default.jwt.refreshExpiresIn,
        issuer: config_1.default.jwt.issuer,
        audience: config_1.default.jwt.audience,
        jwtid: (0, uuid_1.v4)(),
    });
}
/**
 * Store refresh token in database
 */
async function storeRefreshToken(userId, token) {
    // Calculate expiry date
    const decoded = jsonwebtoken_1.default.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    // Store token in database
    await db_1.default.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
}
/**
 * Verify refresh token
 */
async function verifyRefreshToken(token) {
    try {
        // Verify token signature and expiration
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret, {
            issuer: config_1.default.jwt.issuer,
            audience: config_1.default.jwt.audience,
        });
        // Check if token exists in database and is not revoked
        const result = await db_1.default.query('SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()', [token]);
        if (result.rows.length === 0) {
            return null;
        }
        // Get user
        const userResult = await db_1.default.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [decoded.sub]);
        if (userResult.rows.length === 0) {
            return null;
        }
        return userResult.rows[0];
    }
    catch (error) {
        console.error('Error verifying refresh token:', error);
        return null;
    }
}
/**
 * Revoke refresh token
 */
async function revokeRefreshToken(token) {
    try {
        const result = await db_1.default.query('UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token = $1', [token]);
        return result.rowCount > 0;
    }
    catch (error) {
        console.error('Error revoking refresh token:', error);
        return false;
    }
}
/**
 * Revoke all refresh tokens for a user
 */
async function revokeAllUserRefreshTokens(userId) {
    try {
        const result = await db_1.default.query('UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE user_id = $1 AND revoked = FALSE', [userId]);
        return result.rowCount > 0;
    }
    catch (error) {
        console.error('Error revoking user refresh tokens:', error);
        return false;
    }
}
/**
 * Generate both access and refresh tokens
 */
async function generateTokens(user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    // Store refresh token in database
    await storeRefreshToken(user.id, refreshToken);
    // Calculate expiry time in seconds
    const decoded = jsonwebtoken_1.default.decode(accessToken);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    return {
        accessToken,
        refreshToken,
        expiresIn,
    };
}
