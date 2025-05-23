import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createPaymentIntent } from '../../../../backend/src/utils/stripe'; // Adjust path as needed

const paymentIntentSchema = z.object({
  programId: z.number().int().positive(),
  bookingId: z.number().int().positive().optional(),
  // Assuming amount will be fetched from program details, not passed by client
});

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

  const validation = paymentIntentSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { programId, bookingId: existingBookingId } = validation.data;

  try {
    // 1. Get program details (especially price)
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, title, price, currency') // Assuming currency is stored or default to 'usd'
      .eq('id', programId)
      .single();

    if (programError || !program) {
      console.error('Error fetching program for payment intent:', programError);
      return NextResponse.json({ error: 'Program not found or error fetching details' }, { status: 404 });
    }
    
    // Ensure price is a number. The 'price' field in Program type is string (e.g., "$25")
    // This needs to be parsed. For simplicity, assuming it's stored as a number or easily parsable.
    // Example: const amountInCents = parseInt(program.price.replace('$', '')) * 100;
    // For now, assuming program.price is a numeric value representing the smallest currency unit (e.g., cents).
    // If program.price is like "$25.00", it needs parsing. Let's assume it's already in cents.
    const amountInCents = typeof program.price === 'string' ? Math.round(parseFloat(program.price.replace('$', '')) * 100) : program.price;


    if (isNaN(amountInCents) || amountInCents <= 0) {
        return NextResponse.json({ error: 'Invalid program price for payment intent' }, { status: 400 });
    }


    let currentBookingId = existingBookingId;
    let bookingStatus = 'Pending'; // Default for new bookings

    if (existingBookingId) {
      const { data: existingBooking, error: bookingFetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, user_id, program_id')
        .eq('id', existingBookingId)
        .single();

      if (bookingFetchError || !existingBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (existingBooking.user_id !== user.id) {
        return NextResponse.json({ error: 'Booking does not belong to user' }, { status: 403 });
      }
      if (existingBooking.program_id !== programId) {
        return NextResponse.json({ error: 'Booking does not match program' }, { status: 400 });
      }
      // if (existingBooking.status === 'Confirmed' || existingBooking.status === 'completed') { // Using 'completed' from previous tasks
      //   return NextResponse.json({ error: 'Booking is already paid/completed' }, { status: 400 });
      // }
      bookingStatus = existingBooking.status;
    } else {
      // Create a new 'Pending' booking if no bookingId is provided
      const { data: newBooking, error: newBookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: user.id,
          program_id: programId,
          session_id: null, // Intent created before session selection, or this route is for program-level payment
          status: 'Pending',
          program_title: program.title, // Denormalize for easier display
          amount_paid: amountInCents / 100, // Assuming amount_paid stores the final paid amount
          payment_status: 'pending',
          // date, time, location can be from program or session if session_id is known
        })
        .select('id, status')
        .single();

      if (newBookingError || !newBooking) {
        console.error('Error creating new booking for payment intent:', newBookingError);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
      }
      currentBookingId = newBooking.id;
      bookingStatus = newBooking.status;
    }

    if (!currentBookingId) {
        return NextResponse.json({ error: 'Booking ID could not be determined or created.' }, { status: 500 });
    }

    // 2. Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent(
      amountInCents,
      program.currency || 'usd', // Default to USD if not specified
      {
        programId: program.id.toString(),
        bookingId: currentBookingId.toString(),
        userId: user.id,
        // email: user.email // Stripe can use this for receipts
      }
    );

    // 3. Store payment intent details in 'payments' table
    const { error: paymentRecordError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: currentBookingId,
        amount: amountInCents, // Store amount in cents
        currency: program.currency || 'usd',
        status: 'pending', // Initial status of the payment intent
        payment_intent_id: paymentIntent.id,
        user_id: user.id, // Store user_id for easier querying
      });

    if (paymentRecordError) {
      console.error('Error storing payment record:', paymentRecordError);
      // Potentially cancel payment intent with Stripe if this fails critically
      return NextResponse.json({ error: 'Failed to store payment record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        bookingId: currentBookingId,
      },
    });

  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    // Check if it's a Stripe error and format appropriately
    if (error.type && error.type.startsWith('Stripe')) {
        return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error during payment intent creation', details: error.message }, { status: 500 });
  }
}
