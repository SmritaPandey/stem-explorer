import express from 'express';
import { z } from 'zod';
import supabase from '../db/supabase';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const bookingSchema = z.object({
  sessionId: z.string().uuid(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).default('pending'),
  amountPaid: z.number().min(0)
});

// Get user's bookings
router.get('/', async (req, res) => {
  try {
    // Type assertion to AuthRequest
    const authReq = req as AuthRequest;

    // Get bookings with program and session details
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        program_sessions!inner (
          *,
          programs!inner (*)
        )
      `)
      .eq('user_id', authReq.user!.id)
      .order('booking_date', { ascending: false });

    if (error) throw error;

    // Format the data for the frontend
    const formattedBookings = data.map(booking => ({
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.payment_status,
      amountPaid: booking.amount_paid,
      bookingDate: booking.booking_date,
      program: {
        id: booking.program_sessions.programs.id,
        title: booking.program_sessions.programs.title,
        description: booking.program_sessions.programs.description,
        location: booking.program_sessions.programs.location,
        imageUrl: booking.program_sessions.programs.image_url
      },
      session: {
        id: booking.program_sessions.id,
        startTime: booking.program_sessions.start_time,
        endTime: booking.program_sessions.end_time,
        isCancelled: booking.program_sessions.is_cancelled
      }
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create new booking
router.post('/', async (req, res) => {
  try {
    // Type assertion to AuthRequest
    const authReq = req as AuthRequest;

    const { sessionId, paymentStatus, amountPaid } = bookingSchema.parse(req.body);

    // Get the session to check availability
    const { data: session, error: sessionError } = await supabase
      .from('program_sessions')
      .select('*, programs!inner(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Session not found' });
      }
      throw sessionError;
    }

    // Check if session is cancelled
    if (session.is_cancelled) {
      return res.status(400).json({ error: 'This session has been cancelled' });
    }

    // Check if there are available seats
    if (session.current_capacity >= session.programs.max_capacity) {
      return res.status(400).json({ error: 'No seats available for this session' });
    }

    // Check if user already has a booking for this session
    const { data: existingBooking, error: bookingCheckError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', authReq.user!.id)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (bookingCheckError) throw bookingCheckError;

    if (existingBooking) {
      return res.status(400).json({ error: 'You already have a booking for this session' });
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: authReq.user!.id,
        session_id: sessionId,
        status: 'confirmed',
        payment_status: paymentStatus,
        amount_paid: amountPaid
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Update the session capacity
    const { error: updateError } = await supabase
      .from('program_sessions')
      .update({ current_capacity: session.current_capacity + 1 })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
});

// Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    // Type assertion to AuthRequest
    const authReq = req as AuthRequest;

    const bookingId = req.params.id;

    // Get the booking to check if it belongs to the user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', authReq.user!.id)
      .single();

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Booking not found' });
      }
      throw bookingError;
    }

    // Update booking status
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateBookingError) throw updateBookingError;

    // Get the session to update capacity
    const { data: session, error: sessionError } = await supabase
      .from('program_sessions')
      .select('current_capacity')
      .eq('id', booking.session_id)
      .single();

    if (sessionError) throw sessionError;

    // Update session capacity
    const { error: updateSessionError } = await supabase
      .from('program_sessions')
      .update({
        current_capacity: Math.max(0, session.current_capacity - 1)
      })
      .eq('id', booking.session_id);

    if (updateSessionError) throw updateSessionError;

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export const bookingsRouter = router;