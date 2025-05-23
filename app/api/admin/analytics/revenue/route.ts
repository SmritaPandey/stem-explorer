import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import pool from '../../../../../backend/src/db'; // Adjusted path to pool

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  try {
    // Get revenue by month for the last 12 months
    // Assuming 'payments' table and 'booking_id' links to 'bookings' table
    // And 'bookings' table has 'amount_paid' and 'program_id'
    const revenueByMonthResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', b.created_at) as month, /* Assuming payment date is booking creation date for simplicity */
        SUM(b.amount_paid) as revenue
      FROM bookings b
      WHERE b.status = 'Confirmed' /* Or link to a payments table if exists */
        AND b.created_at >= NOW() - INTERVAL '1 year'
      GROUP BY month
      ORDER BY month
    `);
    
    // Get revenue by program category
    const revenueByCategoryResult = await pool.query(`
      SELECT 
        pr.category,
        SUM(b.amount_paid) as revenue,
        COUNT(b.id) as count
      FROM bookings b
      JOIN programs pr ON b.program_id = pr.id
      WHERE b.status = 'Confirmed' /* Or link to a payments table if exists */
      GROUP BY pr.category
      ORDER BY revenue DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        revenueByMonth: revenueByMonthResult.rows,
        revenueByCategory: revenueByCategoryResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching revenue analytics (admin):', error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching revenue analytics',
      details: error.message
    }, { status: 500 });
  }
}
