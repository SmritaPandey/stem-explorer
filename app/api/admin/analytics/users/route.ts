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
    // Get user registrations by month (from 'profiles' table)
    const usersByMonthResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(id) as user_count
      FROM profiles /* Assuming user registration data is in 'profiles' */
      WHERE created_at >= NOW() - INTERVAL '1 year'
      GROUP BY month
      ORDER BY month
    `);
    
    // Get users by age group (from 'profiles' table)
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
      FROM profiles /* Assuming age data is in 'profiles' */
      GROUP BY age_group
      ORDER BY age_group
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        usersByMonth: usersByMonthResult.rows,
        usersByAge: usersByAgeResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching user analytics (admin):', error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching user analytics',
      details: error.message
    }, { status: 500 });
  }
}
