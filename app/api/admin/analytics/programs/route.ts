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
    // Get most popular programs
    const popularProgramsResult = await pool.query(`
      SELECT 
        p.id, p.title, p.category, p.price,
        COUNT(b.id) as booking_count
      FROM programs p
      LEFT JOIN bookings b ON p.id = b.program_id AND b.status = 'Confirmed'
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
      LEFT JOIN bookings b ON p.id = b.program_id AND b.status = 'Confirmed'
      GROUP BY p.category
      ORDER BY booking_count DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        popularPrograms: popularProgramsResult.rows,
        bookingsByCategory: bookingsByCategoryResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching program analytics (admin):', error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching program analytics',
      details: error.message
    }, { status: 500 });
  }
}
