import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import pool from '../../../../backend/src/db'; // Adjusted path to pool

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const offset = (page - 1) * limit;
  const status = searchParams.get("status"); // Can be null if not provided

  try {
    let bookingsQuery = `
      SELECT b.id, b.status, b.created_at,
             u.id as user_id, u.email, prof.first_name, prof.last_name, /* Use profiles (prof) for names */
             p.id as program_id, p.title as program_title, p.date as program_date, p.price as program_price
      FROM bookings b
      LEFT JOIN auth.users u ON b.user_id = u.id /* Join with auth.users for email */
      LEFT JOIN profiles prof ON b.user_id = prof.id /* Join with profiles for names */
      LEFT JOIN programs p ON b.program_id = p.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM bookings b
      LEFT JOIN auth.users u ON b.user_id = u.id
      LEFT JOIN profiles prof ON b.user_id = prof.id
      LEFT JOIN programs p ON b.program_id = p.id
    `;
    
    const queryParams: any[] = [];
    const countQueryParams: any[] = [];

    if (status && status !== 'all') { // Assuming 'all' means no status filter
      const condition = ` b.status = $${queryParams.length + 1}`;
      bookingsQuery += ` WHERE ${condition}`;
      countQuery += ` WHERE ${condition}`;
      queryParams.push(status);
      countQueryParams.push(status);
    }
    
    bookingsQuery += ` ORDER BY b.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const bookingsResult = await pool.query(bookingsQuery, queryParams);
    const countResult = await pool.query(countQuery, countQueryParams);
    
    const totalBookings = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalBookings / limit);
    
    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Error fetching bookings (admin):', error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching bookings',
      details: error.message
    }, { status: 500 });
  }
}
