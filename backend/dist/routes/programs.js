"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.programsRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
exports.programsRouter = router;
// Validation schemas
const createProgramSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    long_description: zod_1.z.string().optional(),
    category: zod_1.z.string(),
    level: zod_1.z.string(),
    duration: zod_1.z.string(),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    location: zod_1.z.string().optional(),
    instructor: zod_1.z.string().optional(),
    seats: zod_1.z.number().int().positive('Seats must be a positive number'),
    price: zod_1.z.number().nonnegative('Price must be a non-negative number'),
    age_group: zod_1.z.string().optional(),
    format: zod_1.z.string().optional(),
    requirements: zod_1.z.array(zod_1.z.string()).optional(),
    topics: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateProgramSchema = createProgramSchema.partial();
/**
 * @route GET /api/programs
 * @desc Get all programs with optional filtering
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        const { category, level, search, min_price, max_price, age_group, format, sort_by = 'date', sort_order = 'asc', page = '1', limit = '10' } = req.query;
        // Build query
        let query = 'SELECT * FROM programs WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        // Add filters
        if (category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(category);
        }
        if (level) {
            query += ` AND level = $${paramIndex++}`;
            params.push(level);
        }
        if (search) {
            query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (min_price) {
            query += ` AND price >= $${paramIndex++}`;
            params.push(parseFloat(min_price));
        }
        if (max_price) {
            query += ` AND price <= $${paramIndex++}`;
            params.push(parseFloat(max_price));
        }
        if (age_group) {
            query += ` AND age_group ILIKE $${paramIndex++}`;
            params.push(`%${age_group}%`);
        }
        if (format) {
            query += ` AND format = $${paramIndex++}`;
            params.push(format);
        }
        // Add sorting
        const validSortFields = ['title', 'date', 'price', 'level', 'category'];
        const validSortOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'date';
        const sortDir = validSortOrders.includes(sort_order) ? sort_order : 'asc';
        query += ` ORDER BY ${sortField} ${sortDir}`;
        // Add pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limitNum, offset);
        // Execute query
        const result = await db_1.default.query(query, params);
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM programs WHERE 1=1`;
        const countParams = params.slice(0, -2); // Remove limit and offset
        const countResult = await db_1.default.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(totalCount / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch programs'
        });
    }
});
/**
 * @route GET /api/programs/categories
 * @desc Get all program categories
 * @access Public
 */
router.get('/categories', async (req, res) => {
    try {
        const result = await db_1.default.query('SELECT DISTINCT category FROM programs ORDER BY category');
        res.json({
            success: true,
            data: result.rows.map(row => row.category)
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});
/**
 * @route GET /api/programs/:id
 * @desc Get program by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_1.default.query('SELECT * FROM programs WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'Program not found');
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
        console.error('Error fetching program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch program'
        });
    }
});
/**
 * @route POST /api/programs
 * @desc Create a new program
 * @access Admin only
 */
router.post('/', auth_1.authenticateJWT, auth_1.requireAdmin, async (req, res) => {
    try {
        const programData = createProgramSchema.parse(req.body);
        const result = await db_1.default.query(`INSERT INTO programs (
        title, description, long_description, category, level,
        duration, date, time, location, instructor,
        seats, price, age_group, format, requirements, topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`, [
            programData.title,
            programData.description,
            programData.long_description || '',
            programData.category,
            programData.level,
            programData.duration,
            programData.date,
            programData.time,
            programData.location || '',
            programData.instructor || '',
            programData.seats,
            programData.price,
            programData.age_group || '',
            programData.format || 'In-person',
            programData.requirements || [],
            programData.topics || []
        ]);
        res.status(201).json({
            success: true,
            data: result.rows[0]
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
        console.error('Error creating program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create program'
        });
    }
});
/**
 * @route PUT /api/programs/:id
 * @desc Update a program
 * @access Admin only
 */
router.put('/:id', auth_1.authenticateJWT, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const programData = updateProgramSchema.parse(req.body);
        // Check if program exists
        const checkResult = await db_1.default.query('SELECT id FROM programs WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'Program not found');
        }
        // Build update query
        const keys = Object.keys(programData).filter(key => programData[key] !== undefined);
        if (keys.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = keys.map(key => programData[key]);
        const query = `UPDATE programs SET ${setClause} WHERE id = $1 RETURNING *`;
        const result = await db_1.default.query(query, [id, ...values]);
        res.json({
            success: true,
            data: result.rows[0]
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
        console.error('Error updating program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update program'
        });
    }
});
/**
 * @route DELETE /api/programs/:id
 * @desc Delete a program
 * @access Admin only
 */
router.delete('/:id', auth_1.authenticateJWT, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if program exists
        const checkResult = await db_1.default.query('SELECT id FROM programs WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            throw new errorHandler_1.ApiError(404, 'Program not found');
        }
        // Check if program has bookings
        const bookingsResult = await db_1.default.query('SELECT id FROM bookings WHERE program_id = $1 LIMIT 1', [id]);
        if (bookingsResult.rows.length > 0) {
            throw new errorHandler_1.ApiError(400, 'Cannot delete program with existing bookings');
        }
        // Delete program
        await db_1.default.query('DELETE FROM programs WHERE id = $1', [id]);
        res.json({
            success: true,
            message: 'Program deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        console.error('Error deleting program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete program'
        });
    }
});
