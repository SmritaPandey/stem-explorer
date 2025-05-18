import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import pool from '../db';

const router = express.Router();

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard statistics
 * @access Admin
 */
router.get('/dashboard', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get total users count
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);
    
    // Get total programs count
    const programsResult = await pool.query('SELECT COUNT(*) FROM programs');
    const totalPrograms = parseInt(programsResult.rows[0].count);
    
    // Get total bookings count
    const bookingsResult = await pool.query('SELECT COUNT(*) FROM bookings');
    const totalBookings = parseInt(bookingsResult.rows[0].count);
    
    // Get total revenue
    const revenueResult = await pool.query(`
      SELECT SUM(amount) FROM payments WHERE status = 'completed'
    `);
    const totalRevenue = parseFloat(revenueResult.rows[0].sum || 0);
    
    // Get recent bookings
    const recentBookingsResult = await pool.query(`
      SELECT b.id, b.status, b.created_at, 
             u.id as user_id, u.email, u.first_name, u.last_name,
             p.id as program_id, p.title as program_title, p.price
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN programs p ON b.program_id = p.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    // Get upcoming programs
    const upcomingProgramsResult = await pool.query(`
      SELECT id, title, date, time, seats, 
             (SELECT COUNT(*) FROM bookings WHERE program_id = programs.id) as booked_seats
      FROM programs
      WHERE date >= CURRENT_DATE
      ORDER BY date ASC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPrograms,
          totalBookings,
          totalRevenue
        },
        recentBookings: recentBookingsResult.rows,
        upcomingPrograms: upcomingProgramsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination
 * @access Admin
 */
router.get('/users', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    
    let query = `
      SELECT id, email, first_name, last_name, role, created_at
      FROM users
    `;
    
    let countQuery = 'SELECT COUNT(*) FROM users';
    const queryParams: any[] = [];
    
    if (search) {
      query += ` WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`;
      countQuery += ` WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const usersResult = await pool.query(query, queryParams);
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/admin/users/:id
 * @desc Get user details
 * @access Admin
 */
router.get('/users/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    // Get user details
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, bio, age, grade, interests, profile_picture, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get user's bookings
    const bookingsResult = await pool.query(`
      SELECT b.id, b.status, b.created_at,
             p.id as program_id, p.title as program_title, p.date, p.price
      FROM bookings b
      JOIN programs p ON b.program_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        bookings: bookingsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user details (admin version)
 * @access Admin
 */
router.put('/users/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update only the provided fields
    const updates: Record<string, any> = {};
    
    if (req.body.firstName !== undefined) {
      updates.first_name = req.body.firstName;
    }
    
    if (req.body.lastName !== undefined) {
      updates.last_name = req.body.lastName;
    }
    
    if (req.body.email !== undefined) {
      updates.email = req.body.email;
    }
    
    if (req.body.role !== undefined) {
      updates.role = req.body.role;
    }
    
    if (req.body.bio !== undefined) {
      updates.bio = req.body.bio;
    }
    
    if (req.body.age !== undefined) {
      updates.age = req.body.age;
    }
    
    if (req.body.grade !== undefined) {
      updates.grade = req.body.grade;
    }
    
    if (req.body.interests !== undefined) {
      updates.interests = req.body.interests;
    }
    
    if (req.body.profilePicture !== undefined) {
      updates.profile_picture = req.body.profilePicture;
    }
    
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
      RETURNING id, email, first_name, last_name, role, bio, age, grade, interests, profile_picture
    `;
    
    const result = await pool.query(query, [userId, ...values]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/admin/bookings
 * @desc Get all bookings with pagination
 * @access Admin
 */
router.get('/bookings', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    
    let query = `
      SELECT b.id, b.status, b.created_at,
             u.id as user_id, u.email, u.first_name, u.last_name,
             p.id as program_id, p.title as program_title, p.date, p.price
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN programs p ON b.program_id = p.id
    `;
    
    let countQuery = 'SELECT COUNT(*) FROM bookings b';
    const queryParams: any[] = [];
    
    if (status) {
      query += ` WHERE b.status = $1`;
      countQuery += ` WHERE b.status = $1`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const bookingsResult = await pool.query(query, queryParams);
    const countResult = await pool.query(countQuery, status ? [status] : []);
    
    const totalBookings = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBookings / limit);
    
    res.json({
      success: true,
      data: {
        bookings: bookingsResult.rows,
        pagination: {
          page,
          limit,
          totalBookings,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route PUT /api/admin/bookings/:id
 * @desc Update booking status
 * @access Admin
 */
router.put('/bookings/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }
    
    if (!status || !['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // Check if booking exists
    const bookingCheck = await pool.query(
      'SELECT id FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Update booking status
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, bookingId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/admin/analytics/revenue
 * @desc Get revenue analytics
 * @access Admin
 */
router.get('/analytics/revenue', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get revenue by month for the last 12 months
    const revenueByMonthResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', p.created_at) as month,
        SUM(p.amount) as revenue
      FROM payments p
      WHERE p.status = 'completed'
        AND p.created_at >= NOW() - INTERVAL '1 year'
      GROUP BY month
      ORDER BY month
    `);
    
    // Get revenue by program category
    const revenueByCategoryResult = await pool.query(`
      SELECT 
        pr.category,
        SUM(p.amount) as revenue,
        COUNT(p.id) as count
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN programs pr ON b.program_id = pr.id
      WHERE p.status = 'completed'
      GROUP BY pr.category
      ORDER BY revenue DESC
    `);
    
    res.json({
      success: true,
      data: {
        revenueByMonth: revenueByMonthResult.rows,
        revenueByCategory: revenueByCategoryResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/admin/analytics/programs
 * @desc Get program analytics
 * @access Admin
 */
router.get('/analytics/programs', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get most popular programs
    const popularProgramsResult = await pool.query(`
      SELECT 
        p.id, p.title, p.category, p.price,
        COUNT(b.id) as booking_count
      FROM programs p
      JOIN bookings b ON p.id = b.program_id
      GROUP BY p.id, p.title, p.category, p.price
      ORDER BY booking_count DESC
      LIMIT 10
    `);
    
    // Get program bookings by category
    const bookingsByCategoryResult = await pool.query(`
      SELECT 
        p.category,
        COUNT(b.id) as booking_count
      FROM programs p
      JOIN bookings b ON p.id = b.program_id
      GROUP BY p.category
      ORDER BY booking_count DESC
    `);
    
    res.json({
      success: true,
      data: {
        popularPrograms: popularProgramsResult.rows,
        bookingsByCategory: bookingsByCategoryResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching program analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/admin/analytics/users
 * @desc Get user analytics
 * @access Admin
 */
router.get('/analytics/users', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get user registrations by month
    const usersByMonthResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(id) as user_count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '1 year'
      GROUP BY month
      ORDER BY month
    `);
    
    // Get users by age group
    const usersByAgeResult = await pool.query(`
      SELECT 
        CASE
          WHEN age < 10 THEN 'Under 10'
          WHEN age BETWEEN 10 AND 12 THEN '10-12'
          WHEN age BETWEEN 13 AND 15 THEN '13-15'
          WHEN age > 15 THEN 'Over 15'
          ELSE 'Unknown'
        END as age_group,
        COUNT(id) as user_count
      FROM users
      GROUP BY age_group
      ORDER BY age_group
    `);
    
    res.json({
      success: true,
      data: {
        usersByMonth: usersByMonthResult.rows,
        usersByAge: usersByAgeResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export const adminRouter = router;
