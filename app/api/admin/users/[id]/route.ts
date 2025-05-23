import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import pool from '../../../../../backend/src/db'; // Adjusted path to pool

// Zod schema for updating user details (admin version)
const adminUserUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(), // Define roles as needed
  bio: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  grade: z.string().optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  profilePicture: z.string().url().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user: adminUser, errorResponse: authError } = await authenticateRoute(request);
  if (authError) return authError;
  if (!adminUser || !requireAdmin(adminUser)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const userId = params.id; // User ID from URL path (should be Supabase auth UUID)

  try {
    // Get user details from 'profiles' table
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, bio, age, grade, interests, profile_picture, created_at FROM profiles WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get user's bookings
    const bookingsResult = await pool.query(`
      SELECT b.id, b.status, b.created_at,
             prog.id as program_id, prog.title as program_title, prog.date, prog.price
      FROM bookings b
      JOIN programs prog ON b.program_id = prog.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    return NextResponse.json({
      success: true,
      data: {
        user: userResult.rows[0],
        bookings: bookingsResult.rows
      }
    });
  } catch (error: any) {
    console.error(`Error fetching user details for ID ${userId} (admin):`, error);
    return NextResponse.json({
      success: false,
      error: 'Server error fetching user details',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user: adminUser, errorResponse: authError } = await authenticateRoute(request);
  if (authError) return authError;
  if (!adminUser || !requireAdmin(adminUser)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const userIdToUpdate = params.id; // User ID from URL path (should be Supabase auth UUID)
  
  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = adminUserUpdateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const updates = validation.data;
  const dbUpdates: Record<string, any> = {};

  // Map schema fields to database column names (snake_case)
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.email !== undefined) dbUpdates.email = updates.email; // Assuming email can be updated in profiles
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.age !== undefined) dbUpdates.age = updates.age;
  if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
  if (updates.interests !== undefined) dbUpdates.interests = updates.interests; // Ensure DB field is text[] or similar
  if (updates.profilePicture !== undefined) dbUpdates.profile_picture = updates.profilePicture;
  
  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
  }
  dbUpdates.updated_at = new Date().toISOString();

  try {
    // Check if user exists in 'profiles'
    const userCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userIdToUpdate]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const setClauses = Object.keys(dbUpdates).map((key, i) => `${key} = $${i + 2}`);
    const values = Object.values(dbUpdates);

    const query = `
      UPDATE profiles
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, email, first_name, last_name, role, bio, age, grade, interests, profile_picture, updated_at
    `;

    const result = await pool.query(query, [userIdToUpdate, ...values]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error(`Error updating user ID ${userIdToUpdate} (admin):`, error);
    return NextResponse.json({
      success: false,
      error: 'Server error updating user',
      details: error.message
    }, { status: 500 });
  }
}
