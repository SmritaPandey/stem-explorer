"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
exports.bookingsRouter = router;
// Validation schemas
const createBookingSchema = zod_1.z.object({
    program_id: zod_1.z.number().int().positive('Program ID must be a positive number'),
});
/**
 * @route GET /api/bookings
 * @desc Get all bookings for the current user
 * @access Private
 */
router.get('/', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Get bookings with program details
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
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings'
        });
    }
});
/**
 * @route POST /api/bookings
 * @desc Create a new booking
 * @access Private
 */
router.post('/', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { program_id } = createBookingSchema.parse(req.body);
        // Check if program exists
        const programResult = await db_1.default.query('SELECT id, seats FROM programs WHERE id = $1', [program_id]);
        if (programResult.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'Program not found');
        }
        // Check if program has available seats
        const availableSeatsResult = await db_1.default.query(`SELECT p.seats, COUNT(b.id) as booked_seats
      FROM programs p
      LEFT JOIN bookings b ON p.id = b.program_id AND b.status != 'Cancelled'
      WHERE p.id = $1
      GROUP BY p.id, p.seats`, [program_id]);
        const { seats, booked_seats } = availableSeatsResult.rows[0];
        if (parseInt(booked_seats) >= seats) {
            throw new errorHandler_1.ApiError(400, 'Program is fully booked');
        }
        // Check if user already has a booking for this program
        const existingBookingResult = await db_1.default.query('SELECT id FROM bookings WHERE user_id = $1 AND program_id = $2 AND status != $3', [userId, program_id, 'Cancelled']);
        if (existingBookingResult.rows.length > 0) {
            throw new errorHandler_1.ApiError(400, 'You already have a booking for this program');
        }
        // Start transaction
        await db_1.default.query('BEGIN');
        try {
            // Create booking
            const result = await db_1.default.query('INSERT INTO bookings (user_id, program_id, status) VALUES ($1, $2, $3) RETURNING *', [userId, program_id, 'Confirmed']);
            // Get program details for the response
            const bookingWithProgramResult = await db_1.default.query(`SELECT b.*,
          p.title, p.date, p.time, p.location, p.category, p.level, p.format
        FROM bookings b
        JOIN programs p ON b.program_id = p.id
        WHERE b.id = $1`, [result.rows[0].id]);
            await db_1.default.query('COMMIT');
            res.status(201).json({
                success: true,
                data: bookingWithProgramResult.rows[0]
            });
        }
        catch (error) {
            await db_1.default.query('ROLLBACK');
            throw error;
        }
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
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking'
        });
    }
});
/**
 * @route GET /api/bookings/:id
 * @desc Get a booking by ID
 * @access Private (owner only)
 */
router.get('/:id', async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Get booking with program details
        const result = await db_1.default.query(`SELECT b.*,
        p.title, p.date, p.time, p.location, p.category, p.level, p.format
      FROM bookings b
      JOIN programs p ON b.program_id = p.id
      WHERE b.id = $1 AND b.user_id = $2`, [id, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'Booking not found');
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking'
        });
    }
});
/**
 * @route PUT /api/bookings/:id/cancel
 * @desc Cancel a booking
 * @access Private (owner only)
 */
router.put('/:id/cancel', async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Start transaction
        await db_1.default.query('BEGIN');
        try {
            // Check if booking exists and belongs to user
            const bookingResult = await db_1.default.query('SELECT id, status, program_id FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
            if (bookingResult.rows.length === 0) {
                throw new errorHandler_1.ApiError(404, 'Booking not found');
            }
            if (bookingResult.rows[0].status === 'Cancelled') {
                throw new errorHandler_1.ApiError(400, 'Booking is already cancelled');
            }
            // Cancel booking
            const result = await db_1.default.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', ['Cancelled', id]);
            await db_1.default.query('COMMIT');
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Booking cancelled successfully'
            });
        }
        catch (error) {
            await db_1.default.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel booking'
        });
    }
});
