import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import pool from '../../../../../backend/src/db'; // Adjusted path to pool

const bookingStatusUpdateSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Cancelled', 'Completed']), // Added 'Completed'
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const bookingId = parseInt(params.id, 10);
  if (isNaN(bookingId)) {
    return NextResponse.json({ success: false, error: 'Invalid booking ID format' }, { status: 400 });
  }
  
  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = bookingStatusUpdateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { status } = validation.data;

  try {
    // Check if booking exists
    const bookingCheck = await pool.query('SELECT id FROM bookings WHERE id = $1', [bookingId]);
    if (bookingCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Update booking status
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, bookingId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error(`Error updating booking ID ${bookingId} (admin):`, error);
    return NextResponse.json({
      success: false,
      error: 'Server error updating booking status',
      details: error.message
    }, { status: 500 });
  }
}
