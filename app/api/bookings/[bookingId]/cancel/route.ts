import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function PUT(request: NextRequest, { params }: { params: { bookingId: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookingId = params.bookingId;
  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    // 1. Fetch the booking to verify ownership and get session_id
    const { data: booking, error: bookingFetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, session_id, status, program_sessions(current_capacity)') // Include session_id and current_capacity
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) {
      if (bookingFetchError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      console.error('Error fetching booking for cancellation:', bookingFetchError);
      return NextResponse.json({ error: 'Failed to fetch booking details', details: bookingFetchError.message }, { status: 500 });
    }

    // 2. Check ownership
    if (booking.user_id !== user.id) {
      // Allow admin to cancel any booking - check if admin role exists on user object
      // For now, assuming only users can cancel their own.
      // if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: You can only cancel your own bookings' }, { status: 403 });
      // }
    }
    
    // 3. Check if already cancelled or completed
    if (booking.status === 'Cancelled' || booking.status === 'completed') {
        return NextResponse.json({ error: `Booking is already ${booking.status.toLowerCase()} and cannot be cancelled.` }, { status: 400 });
    }


    // 4. Update booking status to 'Cancelled'
    const { error: updateBookingError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'Cancelled' })
      .eq('id', bookingId);

    if (updateBookingError) {
      console.error('Error updating booking status to cancelled:', updateBookingError);
      return NextResponse.json({ error: 'Failed to cancel booking', details: updateBookingError.message }, { status: 500 });
    }

    // 5. Decrement current_capacity on the program_sessions table if the booking was confirmed and capacity was counted
    // Only decrement if the booking status *before* cancellation was one that occupied a seat (e.g., 'Confirmed')
    // The original booking.status should be checked or this logic might need refinement based on when capacity is incremented.
    // For simplicity, we decrement if a session_id is present and booking was not already 'Pending' or some other non-capacity-taking state.
    if (booking.session_id && booking.program_sessions) { // Ensure session_id and program_sessions are available
      const currentCapacity = booking.program_sessions.current_capacity || 0;
      const newCapacity = Math.max(0, currentCapacity - 1); // Ensure capacity doesn't go below 0

      const { error: updateSessionError } = await supabaseAdmin
        .from('program_sessions')
        .update({ current_capacity: newCapacity })
        .eq('id', booking.session_id);

      if (updateSessionError) {
        console.error('Error updating session capacity after cancellation:', updateSessionError);
        // The booking is cancelled, but capacity update failed. This might need manual reconciliation or a retry mechanism.
        return NextResponse.json({ 
          message: 'Booking cancelled, but failed to update session capacity. Please contact support.',
          details: updateSessionError.message 
        }, { status: 200 }); // Return 200 as booking is cancelled, but with a warning.
      }
    } else if (booking.session_id) {
        console.warn(`Booking ${bookingId} was cancelled, but program_session data (especially current_capacity) was not available to update capacity.`);
    }


    return NextResponse.json({ message: 'Booking cancelled successfully' });

  } catch (e: any) {
    console.error(`Unexpected error in PUT /api/bookings/${bookingId}/cancel:`, e);
    return NextResponse.json({ error: 'Internal server error cancelling booking', details: e.message }, { status: 500 });
  }
}
