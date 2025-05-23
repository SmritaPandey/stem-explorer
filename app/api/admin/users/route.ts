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
  const searchQuery = searchParams.get("search") || '';

  try {
    let usersQuery = `
      SELECT id, email, first_name, last_name, role, created_at
      FROM profiles  /* Assuming 'profiles' table holds this user data, not 'users' if 'users' is auth.users */
    `;
    let countQuery = 'SELECT COUNT(*) FROM profiles';
    
    const queryParams: any[] = [];
    const countQueryParams: any[] = [];

    if (searchQuery) {
      const searchCondition = ` (email ILIKE $${queryParams.length + 1} OR first_name ILIKE $${queryParams.length + 1} OR last_name ILIKE $${queryParams.length + 1})`;
      usersQuery += ` WHERE ${searchCondition}`;
      countQuery += ` WHERE ${searchCondition}`;
      queryParams.push(`%${searchQuery}%`);
      countQueryParams.push(`%${searchQuery}%`);
    }
    
    usersQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const usersResult = await pool.query(usersQuery, queryParams);
    const countResult = await pool.query(countQuery, countQueryParams);
    
    const totalUsers = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalUsers / limit);
    
    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Error fetching users (admin):', error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching users',
      details: error.message
    }, { status: 500 });
  }
}
