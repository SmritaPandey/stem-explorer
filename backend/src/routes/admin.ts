import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import supabase from '../db/supabase'; // Changed from pool to supabase
import { AuthRequest } from '../middleware/auth'; // Assuming AuthRequest might be used or standardized

const router = express.Router();

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard statistics
 * @access Admin
 */
router.get('/dashboard', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get total users count (from profiles table)
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersError) throw usersError;

    // Get total programs count
    const { count: totalPrograms, error: programsError } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true });
    if (programsError) throw programsError;

    // Get total bookings count
    const { count: totalBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    if (bookingsError) throw bookingsError;

    // Get total revenue (assuming a 'payments' table similar to original query)
    // Note: Supabase client doesn't directly support SUM aggregates in select.
    // This is best done via an RPC call to a database function.
    // For now, fetching relevant payments and summing in JS (less efficient for large datasets).
    // CREATE OR REPLACE FUNCTION get_total_revenue()
    // RETURNS TABLE(total_revenue NUMERIC) AS $$
    // BEGIN
    //  RETURN QUERY SELECT SUM(amount_paid) FROM bookings WHERE payment_status = 'paid';
    // END; $$ LANGUAGE plpgsql;
    // Then use: const { data: revenueData, error: revenueError } = await supabase.rpc('get_total_revenue');
    
    // Simplified approach: sum 'amount_paid' from 'bookings' with 'payment_status' = 'paid'
    // This aligns with the booking actions setting payment_status to 'paid' and amount_paid on bookings.
    const { data: paidBookings, error: revenueError } = await supabase
        .from('bookings')
        .select('amount_paid')
        .eq('payment_status', 'paid');
    if (revenueError) throw revenueError;
    const totalRevenue = paidBookings.reduce((sum, booking) => sum + (booking.amount_paid || 0), 0);

    // Get recent bookings
    // Need to adjust joins for Supabase. Fetch bookings, then related profiles and program_sessions -> programs.
    const { data: recentBookingsData, error: recentBookingsError } = await supabase
      .from('bookings')
      .select(`
        id, 
        status, 
        created_at,
        profiles (id, email, first_name, last_name),
        program_sessions (
          id,
          programs (id, title, price)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    if (recentBookingsError) throw recentBookingsError;
    
    const recentBookings = recentBookingsData.map(b => ({
        id: b.id,
        status: b.status,
        created_at: b.created_at,
        user_id: b.profiles?.id,
        email: b.profiles?.email,
        first_name: b.profiles?.first_name,
        last_name: b.profiles?.last_name,
        program_id: b.program_sessions?.programs?.id,
        program_title: b.program_sessions?.programs?.title,
        price: b.program_sessions?.programs?.price,
    }));


    // Get upcoming programs (sessions)
    // Query program_sessions, include program details, and count bookings for each session.
    // This is more complex due to the subquery for booked_seats.
    // For simplicity, we'll fetch upcoming sessions and their parent program details.
    // Calculating booked_seats per session would ideally be part of the query or an RPC.
    const { data: upcomingSessionsData, error: upcomingSessionsError } = await supabase
        .from('program_sessions')
        .select(`
            id, 
            start_time, 
            end_time,
            current_capacity,
            programs (id, title, max_capacity) 
        `)
        .gte('start_time', new Date().toISOString()) // Ensure it's upcoming
        .order('start_time', { ascending: true })
        .limit(5);
    if (upcomingSessionsError) throw upcomingSessionsError;

    const upcomingProgramsOrSessions = upcomingSessionsData.map(s => ({
        id: s.programs?.id, // Program ID
        session_id: s.id, // Session ID
        title: s.programs?.title,
        date: new Date(s.start_time).toLocaleDateString(), // Extracted from start_time
        time: new Date(s.start_time).toLocaleTimeString(), // Extracted from start_time
        seats: s.programs?.max_capacity, // Max capacity for the program
        booked_seats: s.current_capacity, // Current capacity of the session
    }));
    
    res.json({
      // success: true, // Removed for consistency with other routes
      data: {
        stats: {
          totalUsers: totalUsers || 0,
          totalPrograms: totalPrograms || 0,
          totalBookings: totalBookings || 0,
          totalRevenue
        },
        recentBookings,
        upcomingPrograms: upcomingProgramsOrSessions
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching admin dashboard'
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

    let query = supabase
      .from('profiles') // Changed from 'users' to 'profiles'
      .select('id, email, first_name, last_name, role, created_at', { count: 'exact' });

    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(`email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: usersData, error: usersError, count: totalUsers } = await query;

    if (usersError) throw usersError;

    const totalPages = Math.ceil((totalUsers || 0) / limit);

    res.json({
      // success: true, // Removed for consistency
      data: {
        users: usersData,
        pagination: {
          page,
          limit,
          totalUsers: totalUsers || 0,
          totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching users'
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
    const userId = req.params.id; // User ID is UUID, not an integer

    // Validate if userId is a valid UUID (optional, but good practice)
    if (!z.string().uuid().safeParse(userId).success) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Get user details from 'profiles' table
    // Selecting fields available in the provided schema.sql for 'profiles'
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, phone, profile_picture, created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') { // PostgREST error for "Not found"
        return res.status(404).json({ error: 'User not found' });
      }
      throw userError;
    }
    if (!userProfile) { // Should be caught by PGRST116 with single(), but as a safeguard
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's bookings
    // Joins: bookings -> program_sessions -> programs
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, 
        status, 
        created_at,
        program_sessions (
          start_time, 
          programs (id, title, price)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;
    
    const formattedBookings = bookingsData.map(b => ({
        id: b.id,
        status: b.status,
        created_at: b.created_at,
        program_id: b.program_sessions?.programs?.id,
        program_title: b.program_sessions?.programs?.title,
        // Original query had p.date, which is not directly on programs table but on sessions.
        // Using session start_time for date.
        date: b.program_sessions ? new Date(b.program_sessions.start_time).toLocaleDateString() : null,
        price: b.program_sessions?.programs?.price
    }));

    res.json({
      // success: true, // Removed
      data: {
        user: userProfile, // Supabase returns snake_case by default, which matches original
        bookings: formattedBookings
      }
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching user details'
    });
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user details (admin version)
 * @access Admin
 */

// Zod schema for admin user update
const adminUserUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(), // Note: Changing email might have implications for auth.users.email
  role: z.enum(['user', 'admin']).optional(), // Assuming these are the roles
  phone: z.string().optional().nullable(),
  profilePicture: z.string().url().optional().nullable(),
  // Fields like 'bio', 'age', 'grade', 'interests' were in original but not in profiles schema.
  // Add them to schema if they exist in 'profiles' table.
}).strict(); // Use .strict() to prevent unknown fields

router.put('/users/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!z.string().uuid().safeParse(userId).success) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const parseResult = adminUserUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.flatten() });
    }
    const updatesFromBody = parseResult.data;
    
    const dbUpdates: Record<string, any> = {};
    if (updatesFromBody.firstName !== undefined) dbUpdates.first_name = updatesFromBody.firstName;
    if (updatesFromBody.lastName !== undefined) dbUpdates.last_name = updatesFromBody.lastName;
    if (updatesFromBody.email !== undefined) dbUpdates.email = updatesFromBody.email; // Caution with email updates
    if (updatesFromBody.role !== undefined) dbUpdates.role = updatesFromBody.role;
    if (updatesFromBody.phone !== undefined) dbUpdates.phone = updatesFromBody.phone;
    if (updatesFromBody.profilePicture !== undefined) dbUpdates.profile_picture = updatesFromBody.profilePicture;
    
    // Ensure there's something to update
    if (Object.keys(dbUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }
    dbUpdates.updated_at = new Date().toISOString();

    // Update user in 'profiles' table
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select('id, email, first_name, last_name, role, phone, profile_picture, created_at, updated_at') // Select desired fields
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      // Handle other potential errors, e.g., unique constraint on email if it's being updated
      if (updateError.code === '23505' && dbUpdates.email) { // Unique violation
          return res.status(409).json({ error: 'Email already in use by another account.'});
      }
      throw updateError;
    }
    
    if (!updatedUser) { // Should be caught by PGRST116 with single(), but as a safeguard
        return res.status(404).json({ error: 'User not found or no update performed' });
    }

    res.json({
      // success: true, // Removed
      data: updatedUser 
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error updating user'
    });
  }
});

/**
 * @route GET /api/admin/bookings
 * @desc Get all bookings with pagination
 * @access Admin
 */

// Zod schema for GET /bookings query parameters
const getBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['confirmed', 'cancelled', 'completed', 'pending']).optional(), // Align with DB booking statuses
});

router.get('/bookings', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queryParseResult = getBookingsQuerySchema.safeParse(req.query);
    if (!queryParseResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: queryParseResult.error.flatten() });
    }
    const { page, limit, status } = queryParseResult.data;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookings')
      .select(`
        id, 
        status, 
        created_at,
        payment_status, 
        amount_paid,
        profiles (id, email, first_name, last_name),
        program_sessions (
          start_time,
          programs (id, title, price)
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bookingsData, error: bookingsError, count: totalBookings } = await query;

    if (bookingsError) throw bookingsError;

    const formattedBookings = bookingsData.map(b => ({
      id: b.id,
      status: b.status,
      created_at: b.created_at,
      payment_status: b.payment_status,
      amount_paid: b.amount_paid,
      user_id: b.profiles?.id,
      user_email: b.profiles?.email,
      user_first_name: b.profiles?.first_name,
      user_last_name: b.profiles?.last_name,
      program_id: b.program_sessions?.programs?.id,
      program_title: b.program_sessions?.programs?.title,
      program_session_start_time: b.program_sessions?.start_time,
      program_price: b.program_sessions?.programs?.price,
    }));
    
    const totalPages = Math.ceil((totalBookings || 0) / limit);

    res.json({
      // success: true, // Removed
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          totalBookings: totalBookings || 0,
          totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching bookings'
    });
  }
});

/**
 * @route PUT /api/admin/bookings/:id
 * @desc Update booking status
 * @access Admin
 */

// Zod schema for PUT /bookings/:id request
const updateBookingStatusParamsSchema = z.object({
  id: z.string().uuid(),
});
const updateBookingStatusBodySchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']), // Valid booking statuses from schema
});

router.put('/bookings/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const paramsParseResult = updateBookingStatusParamsSchema.safeParse(req.params);
    if (!paramsParseResult.success) {
      return res.status(400).json({ error: 'Invalid booking ID format', details: paramsParseResult.error.flatten() });
    }
    const { id: bookingId } = paramsParseResult.data;

    const bodyParseResult = updateBookingStatusBodySchema.safeParse(req.body);
    if (!bodyParseResult.success) {
      return res.status(400).json({ error: 'Invalid status provided', details: bodyParseResult.error.flatten() });
    }
    const { status: newStatus } = bodyParseResult.data;

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', bookingId)
      .select()
      .single(); // Use single to ensure bookingId exists, otherwise PGRST116 error

    if (updateError) {
      if (updateError.code === 'PGRST116') { // Not found
        return res.status(404).json({ error: 'Booking not found' });
      }
      throw updateError;
    }
    
    if (!updatedBooking) { // Should be caught by PGRST116 with single(), but as a safeguard
        return res.status(404).json({ error: 'Booking not found or no update performed' });
    }

    res.json({
      // success: true, // Removed
      data: updatedBooking
    });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message ||'Server error updating booking status'
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
    // --- Revenue by Month (Last 12 Months) ---
    // This is best done with an RPC call to a database function for efficiency.
    // CREATE OR REPLACE FUNCTION get_revenue_by_month_last_year()
    // RETURNS TABLE(month TEXT, revenue NUMERIC) AS $$
    // BEGIN
    //  RETURN QUERY 
    //    SELECT TO_CHAR(DATE_TRUNC('month', b.booking_date), 'YYYY-MM') as month, SUM(b.amount_paid) as revenue
    //    FROM bookings b
    //    WHERE b.payment_status = 'paid' AND b.booking_date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
    //    GROUP BY DATE_TRUNC('month', b.booking_date)
    //    ORDER BY month;
    // END; $$ LANGUAGE plpgsql;
    // const { data: revenueByMonthData, error: rbmError } = await supabase.rpc('get_revenue_by_month_last_year');
    // if (rbmError) throw rbmError;

    // Client-side processing alternative (less efficient):
    const elevenMonthsAgo = new Date();
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
    elevenMonthsAgo.setDate(1); // Start of the month
    elevenMonthsAgo.setHours(0,0,0,0);


    const { data: monthlyBookings, error: monthlyBookingsError } = await supabase
        .from('bookings')
        .select('booking_date, amount_paid')
        .eq('payment_status', 'paid')
        .gte('booking_date', elevenMonthsAgo.toISOString());

    if (monthlyBookingsError) throw monthlyBookingsError;

    const revenueByMonth = monthlyBookings.reduce((acc, booking) => {
        const month = booking.booking_date.substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + booking.amount_paid;
        return acc;
    }, {} as Record<string, number>);
    const revenueByMonthFormatted = Object.entries(revenueByMonth).map(([month, revenue]) => ({month, revenue})).sort((a,b) => a.month.localeCompare(b.month));


    // --- Revenue by Program Category ---
    // Also best with RPC.
    // CREATE OR REPLACE FUNCTION get_revenue_by_program_category()
    // RETURNS TABLE(category TEXT, revenue NUMERIC, count BIGINT) AS $$
    // BEGIN
    //   RETURN QUERY
    //     SELECT p.category, SUM(b.amount_paid) as revenue, COUNT(b.id) as count
    //     FROM bookings b
    //     JOIN program_sessions ps ON b.session_id = ps.id
    //     JOIN programs p ON ps.program_id = p.id
    //     WHERE b.payment_status = 'paid'
    //     GROUP BY p.category
    //     ORDER BY revenue DESC;
    // END; $$ LANGUAGE plpgsql;
    // const { data: revenueByCategoryData, error: rbcError } = await supabase.rpc('get_revenue_by_program_category');
    // if (rbcError) throw rbcError;
    
    // Client-side processing alternative (less efficient):
     const { data: categoryBookings, error: categoryBookingsError } = await supabase
        .from('bookings')
        .select('amount_paid, program_sessions(programs(category))')
        .eq('payment_status', 'paid');

    if (categoryBookingsError) throw categoryBookingsError;

    const revenueByCategory = categoryBookings.reduce((acc, booking) => {
        const category = booking.program_sessions?.programs?.category || 'Unknown';
        if (!acc[category]) {
            acc[category] = { revenue: 0, count: 0 };
        }
        acc[category].revenue += booking.amount_paid;
        acc[category].count += 1;
        return acc;
    }, {} as Record<string, {revenue: number, count: number}>);
    const revenueByCategoryFormatted = Object.entries(revenueByCategory).map(([category, data]) => ({category, ...data})).sort((a,b) => b.revenue - a.revenue);

    res.json({
      // success: true, // Removed
      data: {
        revenueByMonth: revenueByMonthFormatted,
        revenueByCategory: revenueByCategoryFormatted
      }
    });
  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching revenue analytics'
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
    // --- Most Popular Programs (Top 10 by booking count) ---
    // This is best done with an RPC call.
    // CREATE OR REPLACE FUNCTION get_popular_programs()
    // RETURNS TABLE(id UUID, title TEXT, category TEXT, price NUMERIC, booking_count BIGINT) AS $$
    // BEGIN
    //   RETURN QUERY
    //     SELECT p.id, p.title, p.category, p.price, COUNT(b.id) as booking_count
    //     FROM programs p
    //     JOIN program_sessions ps ON p.id = ps.program_id
    //     JOIN bookings b ON ps.id = b.session_id
    //     GROUP BY p.id, p.title, p.category, p.price
    //     ORDER BY booking_count DESC
    //     LIMIT 10;
    // END; $$ LANGUAGE plpgsql;
    // const { data: popularProgramsData, error: ppError } = await supabase.rpc('get_popular_programs');
    // if (ppError) throw ppError;

    // Client-side processing alternative:
    const { data: allProgramsWithSessionsAndBookings, error: programsError } = await supabase
      .from('programs')
      .select(`
        id, title, category, price,
        program_sessions ( bookings ( id ) )
      `);
    if (programsError) throw programsError;

    const popularPrograms = allProgramsWithSessionsAndBookings.map(p => {
      let booking_count = 0;
      p.program_sessions.forEach(s => {
        booking_count += s.bookings.length;
      });
      return {
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        booking_count
      };
    })
    .sort((a, b) => b.booking_count - a.booking_count)
    .slice(0, 10);


    // --- Program Bookings by Category ---
    // Also best with RPC.
    // CREATE OR REPLACE FUNCTION get_program_bookings_by_category()
    // RETURNS TABLE(category TEXT, booking_count BIGINT) AS $$
    // BEGIN
    //   RETURN QUERY
    //     SELECT p.category, COUNT(b.id) as booking_count
    //     FROM programs p
    //     JOIN program_sessions ps ON p.id = ps.program_id
    //     JOIN bookings b ON ps.id = b.session_id
    //     GROUP BY p.category
    //     ORDER BY booking_count DESC;
    // END; $$ LANGUAGE plpgsql;
    // const { data: bookingsByCategoryData, error: bbcError } = await supabase.rpc('get_program_bookings_by_category');
    // if (bbcError) throw bbcError;

    // Client-side processing (using the data already fetched if possible, or refetching more targeted data):
    const bookingsByCategory = allProgramsWithSessionsAndBookings.reduce((acc, p) => {
      const category = p.category || 'Unknown';
      let programBookingCount = 0;
      p.program_sessions.forEach(s => {
        programBookingCount += s.bookings.length;
      });
      acc[category] = (acc[category] || 0) + programBookingCount;
      return acc;
    }, {} as Record<string, number>);
    const bookingsByCategoryFormatted = Object.entries(bookingsByCategory)
                                            .map(([category, booking_count]) => ({ category, booking_count }))
                                            .sort((a,b) => b.booking_count - a.booking_count);
    
    res.json({
      // success: true, // Removed
      data: {
        popularPrograms: popularPrograms,
        bookingsByCategory: bookingsByCategoryFormatted
      }
    });
  } catch (error: any) {
    console.error('Error fetching program analytics:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching program analytics'
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
    // --- User Registrations by Month (Last 12 Months) ---
    // Best done with RPC:
    // CREATE OR REPLACE FUNCTION get_user_registrations_by_month()
    // RETURNS TABLE(month TEXT, user_count BIGINT) AS $$
    // BEGIN
    //   RETURN QUERY
    //     SELECT TO_CHAR(DATE_TRUNC('month', p.created_at), 'YYYY-MM') as month, COUNT(p.id) as user_count
    //     FROM profiles p
    //     WHERE p.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
    //     GROUP BY DATE_TRUNC('month', p.created_at)
    //     ORDER BY month;
    // END; $$ LANGUAGE plpgsql;
    // const { data: usersByMonthData, error: ubmError } = await supabase.rpc('get_user_registrations_by_month');
    // if (ubmError) throw ubmError;

    // Client-side processing:
    const elevenMonthsAgoUsers = new Date();
    elevenMonthsAgoUsers.setMonth(elevenMonthsAgoUsers.getMonth() - 11);
    elevenMonthsAgoUsers.setDate(1); // Start of the month
    elevenMonthsAgoUsers.setHours(0,0,0,0);

    const { data: monthlyUsers, error: monthlyUsersError } = await supabase
      .from('profiles') // Switched to 'profiles' table
      .select('created_at')
      .gte('created_at', elevenMonthsAgoUsers.toISOString());
    if (monthlyUsersError) throw monthlyUsersError;

    const usersByMonth = monthlyUsers.reduce((acc, user) => {
      const month = user.created_at.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const usersByMonthFormatted = Object.entries(usersByMonth)
                                    .map(([month, count]) => ({month, user_count: count}))
                                    .sort((a,b) => a.month.localeCompare(b.month));
    
    // --- Users by Age Group ---
    // The 'age' column is not in the 'profiles' table schema provided in supabase/schema.sql.
    // This part of the analytics cannot be implemented without 'age' data or a date_of_birth field.
    // Returning an empty array for usersByAge.
    const usersByAgeFormatted = []; 
    // If 'age' or 'date_of_birth' were available, a similar client-side processing or RPC could be used.
    // Example RPC if 'date_of_birth' existed:
    // CREATE OR REPLACE FUNCTION get_users_by_age_group()
    // RETURNS TABLE(age_group TEXT, user_count BIGINT) AS $$
    // BEGIN
    //   RETURN QUERY
    //     SELECT 
    //       CASE
    //         WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 10 THEN 'Under 10'
    //         WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN 10 AND 12 THEN '10-12'
    //         /* ... more cases ... */
    //         ELSE 'Unknown'
    //       END as age_group,
    //       COUNT(p.id) as user_count
    //     FROM profiles p
    //     GROUP BY age_group
    //     ORDER BY age_group;
    // END; $$ LANGUAGE plpgsql;
    
    res.json({
      // success: true, // Removed
      data: {
        usersByMonth: usersByMonthFormatted,
        usersByAge: usersByAgeFormatted // Note: This will be empty due to missing 'age' field in profiles
      }
    });
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      // success: false, // Removed
      error: error.message || 'Server error fetching user analytics'
    });
  }
});

export const adminRouter = router;
