"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const errorHandler_1 = require("../middleware/errorHandler");
const config_1 = __importDefault(require("../config"));
const router = express_1.default.Router();
exports.usersRouter = router;
// Validation schemas
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').optional(),
    bio: zod_1.z.string().optional(),
    age: zod_1.z.number().int().positive('Age must be a positive number').optional(),
    grade: zod_1.z.string().optional(),
    interests: zod_1.z.array(zod_1.z.string()).optional(),
    profilePicture: zod_1.z.string().url('Profile picture must be a valid URL').optional(),
});
const updatePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: zod_1.z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private
 */
router.get('/profile', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = await db_1.default.query(`SELECT id, email, first_name, last_name, bio, age, grade, interests,
        profile_picture, created_at, last_login
      FROM users
      WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'User not found');
        }
        // Format response
        const user = result.rows[0];
        const profile = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            bio: user.bio,
            age: user.age,
            grade: user.grade,
            interests: user.interests,
            profilePicture: user.profile_picture,
            createdAt: user.created_at,
            lastLogin: user.last_login
        };
        res.json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile'
        });
    }
});
/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const profileData = updateProfileSchema.parse(req.body);
        // Build update query
        const updates = {};
        if (profileData.firstName)
            updates.first_name = profileData.firstName;
        if (profileData.lastName)
            updates.last_name = profileData.lastName;
        if (profileData.bio !== undefined)
            updates.bio = profileData.bio;
        if (profileData.age !== undefined)
            updates.age = profileData.age;
        if (profileData.grade !== undefined)
            updates.grade = profileData.grade;
        if (profileData.interests !== undefined)
            updates.interests = profileData.interests;
        if (profileData.profilePicture !== undefined)
            updates.profile_picture = profileData.profilePicture;
        updates.updated_at = new Date();
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }
        // Generate SQL query
        const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`);
        const values = Object.values(updates);
        const query = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, email, first_name, last_name, bio, age, grade, interests, profile_picture
    `;
        const result = await db_1.default.query(query, [userId, ...values]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'User not found');
        }
        // Format response
        const user = result.rows[0];
        const profile = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            bio: user.bio,
            age: user.age,
            grade: user.grade,
            interests: user.interests,
            profilePicture: user.profile_picture
        };
        res.json({
            success: true,
            data: profile,
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                errors: error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        if (error instanceof errorHandler_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user profile'
        });
    }
});
/**
 * @route PUT /api/users/password
 * @desc Update user password
 * @access Private
 */
router.put('/password', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const passwordData = updatePasswordSchema.parse(req.body);
        // Get current user
        const userResult = await db_1.default.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'User not found');
        }
        // Verify current password
        const isPasswordValid = await bcryptjs_1.default.compare(passwordData.currentPassword, userResult.rows[0].password_hash);
        if (!isPasswordValid) {
            throw new errorHandler_1.ApiError(401, 'Current password is incorrect');
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(passwordData.newPassword, config_1.default.security.bcryptSaltRounds);
        // Update password
        await db_1.default.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                errors: error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        if (error instanceof errorHandler_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update password'
        });
    }
});
/**
 * @route GET /api/users/bookings
 * @desc Get user's bookings
 * @access Private
 */
router.get('/bookings', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = await db_1.default.query(`SELECT b.*,
        p.title, p.date, p.time, p.location, p.category, p.level, p.format
      FROM bookings b
      JOIN programs p ON b.program_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`, [userId]);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user bookings'
        });
    }
});
