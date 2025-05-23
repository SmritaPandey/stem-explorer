import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';

// Zod schema for creating a new booking
const bookingCreateSchema = z.object({
  program_session_id: z.string().uuid("Invalid Program Session ID format"), // Changed from sessionId
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).default('pending'),
  amountPaid: z.number().min(0),
  // Add other fields if necessary, e.g., specific booking notes
});

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        status,
        payment_status,
        amount_paid,
        booking_date:created_at, /* Assuming booking_date is the creation timestamp of the booking */
        program_sessions (
          id,
          start_time,
          end_time,
          is_cancelled,
          programs (
            id,
            title,
            description,
            location,
            icon, /* Assuming programs table has an icon field */
            image_url /* Assuming programs table has an image_url field */
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings', details: error.message }, { status: 500 });
    }

    // Format the data for the frontend (similar to original Express route)
    const formattedBookings = data.map(booking => {
      // Handle potential null relations if a session or program was deleted, though FK constraints should prevent this.
      if (!booking.program_sessions || !booking.program_sessions.programs) {
        console.warn(`Booking ID ${booking.id} has missing related session or program data.`);
        return { // Return a minimal representation or null
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.payment_status,
          amountPaid: booking.amount_paid,
          bookingDate: booking.booking_date,
          program: { title: "Program data missing" },
          session: { startTime: "Session data missing" }
        };
      }
      return {
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
          icon: booking.program_sessions.programs.icon,
          imageUrl: booking.program_sessions.programs.image_url,
        },
        session: {
          id: booking.program_sessions.id,
          startTime: booking.program_sessions.start_time,
          endTime: booking.program_sessions.end_time,
          isCancelled: booking.program_sessions.is_cancelled,
        },
      };
    });

    return NextResponse.json(formattedBookings);
  } catch (e: any) {
    console.error('Unexpected error in GET /api/bookings:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}

// POST handler will be added in the next step
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = bookingCreateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { program_session_id, paymentStatus, amountPaid } = validation.data;

  try {
    // 1. Fetch the program session and its linked program details
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('program_sessions')
      .select(`
        id,
        start_time,
        end_time,
        current_capacity,
        is_cancelled,
        programs (
          id,
          title,
          max_capacity
        )
      `)
      .eq('id', program_session_id)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Program session not found' }, { status: 404 });
      }
      console.error('Error fetching program session:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch session details', details: sessionError.message }, { status: 500 });
    }

    if (!session.programs) {
        return NextResponse.json({ error: 'Program details not found for this session' }, { status: 404 });
    }
    
    // 2. Perform checks
    if (session.is_cancelled) {
      return NextResponse.json({ error: 'This session has been cancelled and cannot be booked' }, { status: 400 });
    }

    if (session.current_capacity >= session.programs.max_capacity) {
      return NextResponse.json({ error: 'No seats available for this session. It is fully booked.' }, { status: 400 });
    }

    // Check if user already has a booking for this session
    const { data: existingBooking, error: bookingCheckError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_id', program_session_id) // Ensure your bookings table uses 'session_id'
      .maybeSingle();

    if (bookingCheckError) {
      console.error('Error checking existing booking:', bookingCheckError);
      return NextResponse.json({ error: 'Failed to verify existing bookings', details: bookingCheckError.message }, { status: 500 });
    }

    if (existingBooking) {
      return NextResponse.json({ error: 'You already have a booking for this session' }, { status: 400 });
    }

    // 3. If checks pass, insert the new booking (transaction recommended here)
    const newBookingData = {
      user_id: user.id,
      session_id: program_session_id, // Corrected field name
      status: 'Confirmed' as const, // Default to Confirmed, or use paymentStatus if it dictates this
      payment_status: paymentStatus,
      amount_paid: amountPaid,
      // booking_date is handled by created_at default in DB
    };

    const { data: createdBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(newBookingData)
      .select(`
        id, status, payment_status, amount_paid, created_at, session_id, user_id
      `) // Select the fields needed for the response
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking', details: bookingError.message }, { status: 500 });
    }

    // 4. Increment current_capacity on the program_sessions table
    // It's crucial this part is transactional with the booking insertion in a real high-concurrency scenario.
    // Supabase Edge Functions (Database Functions) are better for true transactions.
    // For now, proceed with separate calls.
    const newCapacity = (session.current_capacity || 0) + 1;
    const { error: updateError } = await supabaseAdmin
      .from('program_sessions')
      .update({ current_capacity: newCapacity })
      .eq('id', program_session_id);

    if (updateError) {
      console.error('Error updating session capacity:', updateError);
      // Potentially attempt to roll back the booking or flag it for review
      return NextResponse.json({ 
        error: 'Booking created, but failed to update session capacity. Please contact support.', 
        details: updateError.message,
        booking: createdBooking // Still return the booking if it was made
      }, { status: 500 }); 
    }

    // Return the created booking
    // Fetch the newly created booking with its relations to match GET response structure
    const { data: detailedCreatedBooking, error: fetchCreatedError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, status, payment_status, amount_paid, booking_date:created_at,
        program_sessions (id, start_time, end_time, is_cancelled, programs (id, title, description, location, icon, image_url))
      `)
      .eq('id', createdBooking.id)
      .single();

    if (fetchCreatedError || !detailedCreatedBooking) {
      console.error('Error fetching detailed created booking:', fetchCreatedError);
      // Return the basic createdBooking if detailed fetch fails
      return NextResponse.json(createdBooking, { status: 201 });
    }
    
    // Format the detailed created booking
    const formattedCreatedBooking = {
        id: detailedCreatedBooking.id,
        status: detailedCreatedBooking.status,
        paymentStatus: detailedCreatedBooking.payment_status,
        amountPaid: detailedCreatedBooking.amount_paid,
        bookingDate: detailedCreatedBooking.booking_date,
        program: {
          id: detailedCreatedBooking.program_sessions?.programs?.id,
          title: detailedCreatedBooking.program_sessions?.programs?.title,
          description: detailedCreatedBooking.program_sessions?.programs?.description,
          location: detailedCreatedBooking.program_sessions?.programs?.location,
          icon: detailedCreatedBooking.program_sessions?.programs?.icon,
          imageUrl: detailedCreatedBooking.program_sessions?.programs?.image_url,
        },
        session: {
          id: detailedCreatedBooking.program_sessions?.id,
          startTime: detailedCreatedBooking.program_sessions?.start_time,
          endTime: detailedCreatedBooking.program_sessions?.end_time,
          isCancelled: detailedCreatedBooking.program_sessions?.is_cancelled,
        },
    };


    return NextResponse.json(formattedCreatedBooking, { status: 201 });

  } catch (e: any) {
    console.error('Unexpected error in POST /api/bookings:', e);
    return NextResponse.json({ error: 'Internal server error creating booking', details: e.message }, { status: 500 });
  }
}
