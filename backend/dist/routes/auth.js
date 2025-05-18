"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const config_1 = __importDefault(require("../config"));
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation schemas
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
});
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
    try {
        // Validate request body
        const { firstName, lastName, email, password } = registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, config_1.default.security.bcryptSaltRounds);
        // Create user
        const result = await db_1.default.query(`INSERT INTO users (
        first_name, last_name, email, password_hash, role
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role`, [firstName, lastName, email, hashedPassword, 'user']);
        const user = result.rows[0];
        // Generate tokens
        const tokens = await (0, jwt_1.generateTokens)(user);
        // Set refresh token in HTTP-only cookie
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.server.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        // Return access token and user info
        res.status(201).json({
            success: true,
            data: {
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors.map(e => e.message).join(', ')
            });
        }
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during registration'
        });
    }
});
/**
 * @route POST /api/auth/login
 * @desc Login user and return tokens
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        // Validate request body
        const { email, password } = loginSchema.parse(req.body);
        // Find user
        const result = await db_1.default.query('SELECT id, email, password_hash, first_name, last_name, role, profile_picture FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const user = result.rows[0];
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        // Update last login timestamp
        await db_1.default.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        // Generate tokens
        const tokens = await (0, jwt_1.generateTokens)(user);
        // Set refresh token in HTTP-only cookie
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.server.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        // Return access token and user info
        res.json({
            success: true,
            data: {
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    profilePicture: user.profile_picture
                }
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors.map(e => e.message).join(', ')
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during login'
        });
    }
});
/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
    try {
        // Get refresh token from request body or cookie
        let refreshToken = '';
        if (req.cookies && req.cookies.refresh_token) {
            refreshToken = req.cookies.refresh_token;
        }
        else {
            const { refreshToken: bodyToken } = refreshTokenSchema.parse(req.body);
            refreshToken = bodyToken;
        }
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token is required'
            });
        }
        // Verify refresh token
        const user = await (0, jwt_1.verifyRefreshToken)(refreshToken);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }
        // Generate new tokens
        const tokens = await (0, jwt_1.generateTokens)(user);
        // Set refresh token in HTTP-only cookie
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.server.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        // Return new access token
        res.json({
            success: true,
            data: {
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors.map(e => e.message).join(', ')
            });
        }
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while refreshing token'
        });
    }
});
/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Private
 */
router.post('/logout', auth_1.authenticateJWT, async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken) {
            // Revoke refresh token
            await (0, jwt_1.revokeRefreshToken)(refreshToken);
        }
        // Clear refresh token cookie
        res.clearCookie('refresh_token');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during logout'
        });
    }
});
/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', auth_1.authenticateJWT, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            data: {
                id: user === null || user === void 0 ? void 0 : user.id,
                email: user === null || user === void 0 ? void 0 : user.email,
                firstName: user === null || user === void 0 ? void 0 : user.first_name,
                lastName: user === null || user === void 0 ? void 0 : user.last_name,
                role: user === null || user === void 0 ? void 0 : user.role,
                profilePicture: user === null || user === void 0 ? void 0 : user.profile_picture
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching user data'
        });
    }
});
// Google OAuth routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => {
    passport_1.default.authenticate('google', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.redirect(`${config_1.default.cors.origin}/login?error=oauth_failed`);
        }
        try {
            // Generate tokens
            const tokens = await (0, jwt_1.generateTokens)(user);
            // Set refresh token in HTTP-only cookie
            res.cookie('refresh_token', tokens.refreshToken, {
                httpOnly: true,
                secure: config_1.default.server.nodeEnv === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            // Redirect to frontend with access token
            res.redirect(`${config_1.default.cors.origin}/oauth-callback?token=${tokens.accessToken}`);
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${config_1.default.cors.origin}/login?error=server_error`);
        }
    })(req, res, next);
});
// GitHub OAuth routes
router.get('/github', passport_1.default.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', (req, res, next) => {
    passport_1.default.authenticate('github', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.redirect(`${config_1.default.cors.origin}/login?error=oauth_failed`);
        }
        try {
            // Generate tokens
            const tokens = await (0, jwt_1.generateTokens)(user);
            // Set refresh token in HTTP-only cookie
            res.cookie('refresh_token', tokens.refreshToken, {
                httpOnly: true,
                secure: config_1.default.server.nodeEnv === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            // Redirect to frontend with access token
            res.redirect(`${config_1.default.cors.origin}/oauth-callback?token=${tokens.accessToken}`);
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${config_1.default.cors.origin}/login?error=server_error`);
        }
    })(req, res, next);
});
exports.authRouter = router;
