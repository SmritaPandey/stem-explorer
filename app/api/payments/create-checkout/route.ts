import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createCheckoutSession } from '../../../../backend/src/utils/stripe'; // Adjust path as needed

const checkoutSessionSchema = z.object({
  programId: z.number().int().positive(),
  // Optional: If specific session is being booked directly via checkout
  programSessionId: z.string().uuid().optional(), 
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

  const validation = checkoutSessionSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { programId, programSessionId } = validation.data;

  try {
    // 1. Get program details (price, title)
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, title, price, currency') // Assuming currency is stored, defaults to 'usd'
      .eq('id', programId)
      .single();

    if (programError || !program) {
      console.error('Error fetching program for checkout session:', programError);
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    
    // Parse price to cents
    const amountInCents = typeof program.price === 'string' ? Math.round(parseFloat(program.price.replace('$', '')) * 100) : program.price;
    if (isNaN(amountInCents) || amountInCents <= 0) {
        return NextResponse.json({ error: 'Invalid program price for checkout session' }, { status: 400 });
    }

    // 2. Create a 'Pending' booking
    // If programSessionId is provided, link it. Otherwise, it's a program-level booking.
    const bookingInsertData: any = {
      user_id: user.id,
      program_id: programId,
      status: 'Pending',
      program_title: program.title, // Denormalize for easier display
      amount_paid: amountInCents / 100, // Store final amount in dollars/main unit
      payment_status: 'pending',
    };
    if (programSessionId) {
      bookingInsertData.session_id = programSessionId;
    }

    const { data: newBooking, error: newBookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingInsertData)
      .select('id')
      .single();

    if (newBookingError || !newBooking) {
      console.error('Error creating new booking for checkout session:', newBookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${siteUrl}/dashboard/bookings/success?booking_id=${newBooking.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/dashboard/bookings/cancel?booking_id=${newBooking.id}`;

    // 3. Create Stripe Checkout Session
    const checkoutSession = await createCheckoutSession(
      programId, // line_items.price_data.product_data.metadata.programId
      program.title,
      amountInCents,
      program.currency || 'usd',
      user.id, // For metadata and potentially customer matching in Stripe
      user.email || '', // For customer matching / creation in Stripe
      successUrl,
      cancelUrl,
      { // Pass booking_id in metadata to link Stripe session to booking
        bookingId: newBooking.id.toString(),
        programId: program.id.toString(),
        userId: user.id,
        ...(programSessionId && { programSessionId: programSessionId }) // Include session if applicable
      }
    );
    
    if (!checkoutSession.id || !checkoutSession.url) {
        console.error('Stripe Checkout Session creation failed or returned invalid data.');
        return NextResponse.json({ error: 'Failed to create Stripe Checkout session.' }, { status: 500 });
    }

    // 4. Store payment intent/checkout session details in 'payments' table
    // The payment_intent_id might be on the checkoutSession object after creation, or might need to be fetched after success.
    // For checkout, the payment_intent is often available on the session object (e.g., session.payment_intent)
    const paymentIntentId = typeof checkoutSession.payment_intent === 'string' 
        ? checkoutSession.payment_intent 
        : checkoutSession.payment_intent?.id;


    const { error: paymentRecordError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: newBooking.id,
        amount: amountInCents,
        currency: program.currency || 'usd',
        status: 'pending', // Status of the payment itself
        payment_intent_id: paymentIntentId || null, // Store if available
        stripe_session_id: checkoutSession.id, // Store checkout session ID
        user_id: user.id,
      });

    if (paymentRecordError) {
      console.error('Error storing payment record for checkout session:', paymentRecordError);
      // This is not ideal, checkout session is created. Log for reconciliation.
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        bookingId: newBooking.id,
      },
    });

  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    if (error.type && error.type.startsWith('Stripe')) {
        return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error during checkout session creation', details: error.message }, { status: 500 });
  }
}
