import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import pool from '../../../../backend/src/db'; // Adjusted path to pool

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  try {
    // Get total users count
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count, 10);
    
    // Get total programs count
    const programsResult = await pool.query('SELECT COUNT(*) FROM programs');
    const totalPrograms = parseInt(programsResult.rows[0].count, 10);
    
    // Get total bookings count
    const bookingsResult = await pool.query('SELECT COUNT(*) FROM bookings');
    const totalBookings = parseInt(bookingsResult.rows[0].count, 10);
    
    // Get total revenue (assuming a 'payments' table and 'amount' column)
    // This query might need adjustment based on actual payments table structure
    const revenueResult = await pool.query(
      "SELECT SUM(amount_paid) FROM bookings WHERE status = 'Confirmed'" // Adjust if payments are in a separate table
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].sum || 0);
    
    // Get recent bookings (adjust table and column names as per your schema)
    const recentBookingsResult = await pool.query(`
      SELECT b.id, b.status, b.created_at, 
             u.id as user_id, u.email, p.first_name, p.last_name, -- Assuming profiles table 'p' for names
             prog.id as program_id, prog.title as program_title, prog.price
      FROM bookings b
      LEFT JOIN profiles p ON b.user_id = p.id -- Join with profiles for user names
      LEFT JOIN programs prog ON b.program_id = prog.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    // Get upcoming programs (adjust table and column names)
    const upcomingProgramsResult = await pool.query(`
      SELECT id, title, date, time, seats, 
             (SELECT COUNT(*) FROM bookings WHERE program_id = programs.id AND status = 'Confirmed') as booked_seats
      FROM programs
      WHERE date >= CURRENT_DATE
      ORDER BY date ASC
      LIMIT 5
    `);
    
    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching admin dashboard',
      details: error.message
    }, { status: 500 });
  }
}
