import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth'; // Added AuthRequest
import supabase from '../db/supabase'; // Changed from pool to supabase
import { 
  createPaymentIntent, 
  createCheckoutSession, 
  handleWebhookEvent 
} from '../utils/stripe'; // Assuming stripe utils are correctly set up

const router = express.Router();

// Zod Schemas (IDs changed to UUID strings)
const paymentIntentSchema = z.object({
  programId: z.string().uuid(), // Assuming programId is now UUID
  sessionId: z.string().uuid(), // Use sessionId instead of programId directly for booking
  bookingId: z.string().uuid().optional(), // Booking ID if retrying payment
});

const checkoutSessionSchema = z.object({
  programId: z.string().uuid(), // Program ID
  sessionId: z.string().uuid(), // Session ID
});

/**
 * @route POST /api/payments/create-intent
 * @desc Create a payment intent for a program session
 * @access Private
 */
router.post('/create-intent', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, bookingId: existingBookingId } = paymentIntentSchema.parse(req.body);
    const user = req.user!; // user is guaranteed by authenticateJWT

    // Get session details (which includes program price via join or direct on session)
    const { data: sessionData, error: sessionError } = await supabase
      .from('program_sessions')
      .select(`
        id,
        is_cancelled,
        current_capacity,
        programs (id, title, price, max_capacity)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      if (sessionError?.code === 'PGRST116' || !sessionData) {
        return res.status(404).json({ error: 'Program session not found' });
      }
      throw sessionError;
    }

    if (sessionData.is_cancelled) {
        return res.status(400).json({ error: 'This session has been cancelled.' });
    }
    if (!sessionData.programs) { // Should not happen if joins are correct
        return res.status(404).json({ error: 'Program details not found for session.' });
    }
    if (sessionData.current_capacity >= sessionData.programs.max_capacity) {
        return res.status(400).json({ error: 'No seats available for this session.' });
    }

    const program = sessionData.programs;
    let bookingIdToUse = existingBookingId;
    let bookingStatus = '';

    if (existingBookingId) {
      const { data: existingBooking, error: bookingFetchError } = await supabase
        .from('bookings')
        .select('id, status, payment_status, user_id')
        .eq('id', existingBookingId)
        .single();

      if (bookingFetchError || !existingBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      if (existingBooking.user_id !== user.id) {
        return res.status(403).json({ error: 'Cannot process payment for another user\'s booking.' });
      }
      if (existingBooking.payment_status === 'paid' && existingBooking.status === 'confirmed') {
        return res.status(400).json({ error: 'Booking is already paid and confirmed' });
      }
      bookingStatus = existingBooking.status;
    } else {
      // Create new booking if no bookingId provided
      const { data: newBooking, error: newBookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          status: 'pending', // Booking status is pending until payment
          payment_status: 'pending',
          amount_paid: program.price // Store amount to be paid
        })
        .select('id, status')
        .single();
      
      if (newBookingError) throw newBookingError;
      if (!newBooking) throw new Error("Booking creation failed.");

      bookingIdToUse = newBooking.id;
      bookingStatus = newBooking.status;
    }
    
    if (!bookingIdToUse) throw new Error("Booking ID not determined.");

    // Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent(
      Math.round(program.price * 100), // Stripe expects amount in cents
      'usd', // Currency
      { // Metadata
        programId: program.id,
        sessionId: sessionId,
        bookingId: bookingIdToUse,
        userId: user.id
      }
    );

    // Store/update payment record in 'payments' table
    const { error: paymentDbError } = await supabase
      .from('payments')
      .upsert({ // Use upsert in case a payment record was previously created for this booking
        booking_id: bookingIdToUse,
        amount: program.price,
        currency: 'usd',
        status: 'pending', // Stripe PI status
        payment_intent_id: paymentIntent.id,
      }, { onConflict: 'payment_intent_id' }) // Or onConflict: 'booking_id' if one booking has one payment
      .select(); 
      // Ensure your 'payments' table has a unique constraint on 'payment_intent_id' or 'booking_id' for upsert to work as expected.

    if (paymentDbError) throw paymentDbError;

    res.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: bookingIdToUse
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: error.message || 'Server error creating payment intent' });
  }
});

/**
 * @route POST /api/payments/create-checkout
 * @desc Create a Stripe Checkout session for a program session
 * @access Private
 */
router.post('/create-checkout', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = checkoutSessionSchema.parse(req.body); // Expect sessionId
    const user = req.user!;

    // Get session and program details
    const { data: sessionData, error: sessionError } = await supabase
      .from('program_sessions')
      .select(`
        id,
        is_cancelled,
        current_capacity,
        programs (id, title, price, max_capacity)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return res.status(404).json({ error: 'Program session not found' });
    }
    if (sessionData.is_cancelled) return res.status(400).json({ error: 'Session is cancelled.' });
    if (!sessionData.programs) return res.status(404).json({ error: 'Program details not found.' });
    if (sessionData.current_capacity >= sessionData.programs.max_capacity) return res.status(400).json({ error: 'No seats available.' });

    const program = sessionData.programs;

    // Create a 'pending' booking first
    const { data: newBooking, error: newBookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        status: 'pending',
        payment_status: 'pending',
        amount_paid: program.price
      })
      .select('id')
      .single();

    if (newBookingError) throw newBookingError;
    if (!newBooking) throw new Error("Booking creation failed for checkout.");

    // Create Stripe Checkout session
    const stripeSession = await createCheckoutSession(
      program.id, // For metadata or line item description
      program.title,
      Math.round(program.price * 100), // Stripe expects amount in cents
      user.id, // For metadata
      `${process.env.FRONTEND_URL}/dashboard/bookings/success?booking_id=${newBooking.id}&session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.FRONTEND_URL}/dashboard/bookings/cancel?booking_id=${newBooking.id}`,
      { // Pass metadata to Stripe Checkout
        booking_id: newBooking.id,
        session_id: sessionId,
        user_id: user.id,
        program_id: program.id,
      }
    );
    
    if (!stripeSession.id) throw new Error("Stripe Checkout session creation failed.");

    // Store payment attempt (optional, as webhook is primary)
    await supabase
      .from('payments')
      .insert({
        booking_id: newBooking.id,
        amount: program.price,
        currency: 'usd',
        status: 'pending', // Will be updated by webhook
        checkout_session_id: stripeSession.id, // Store Stripe Checkout Session ID
        payment_intent_id: stripeSession.payment_intent as string || undefined, // if available
      });

    res.json({
      sessionId: stripeSession.id, // Stripe session ID
      url: stripeSession.url // URL for redirection to Stripe Checkout
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Checkout session creation error:', error);
    res.status(500).json({ error: error.message || 'Server error creating checkout session' });
  }
});

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhook events
 * @access Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) return res.status(400).json({ error: 'Stripe signature is missing' });

    const event = await handleWebhookEvent(req.body, signature);

    switch (event.type) {
      case 'checkout.session.completed': // Handle checkout session success
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;
      case 'payment_intent.succeeded':
        // This might be redundant if checkout.session.completed is handled,
        // but can be a fallback or for other payment flows.
        await handlePaymentSucceeded(event.data.object as any);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as any);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook error:', error);
    res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
});

// Helper for checkout.session.completed
async function handleCheckoutSessionCompleted(session: any) {
  const bookingId = session.metadata?.booking_id;
  const paymentIntentId = session.payment_intent;
  const amountTotal = session.amount_total / 100; // Convert cents to dollars
  const currency = session.currency;

  if (!bookingId) {
    console.error('Webhook Error: Missing booking_id in checkout.session.completed metadata', session);
    return;
  }

  // Update booking status to 'confirmed'
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', payment_status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (bookingError) {
    console.error(`Webhook: Error updating booking ${bookingId} to confirmed:`, bookingError);
    // Potentially retry or log for manual intervention
    return; 
  }

  // Update/Create payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert({
      booking_id: bookingId,
      amount: amountTotal,
      currency: currency.toUpperCase(),
      status: 'completed',
      payment_intent_id: paymentIntentId,
      checkout_session_id: session.id,
      receipt_url: (session.payment_intent as any)?.charges?.data[0]?.receipt_url || null, // Requires expanding PI
      updated_at: new Date().toISOString()
    }, { onConflict: 'booking_id' }) // Assuming one payment per booking
    .select();

  if (paymentError) {
    console.error(`Webhook: Error upserting payment for booking ${bookingId}:`, paymentError);
  } else {
     // Increment session capacity (if not already handled elsewhere or if booking status change drives this)
     const {data: bookingDetails} = await supabase.from('bookings').select('session_id').eq('id', bookingId).single();
     if(bookingDetails?.session_id){
        await supabase.rpc('increment_session_capacity', { session_id_param: bookingDetails.session_id });
     }
    console.log(`Webhook: Successfully processed checkout.session.completed for booking ${bookingId}`);
  }
}


/**
 * Handle successful payment (typically for PaymentIntents not via Checkout Session)
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId) {
    console.error('Webhook Error: No booking_id in payment_intent.succeeded metadata', paymentIntent);
    return;
  }

  // This might be a redundant update if handleCheckoutSessionCompleted already did it.
  // Check current status first or ensure idempotency.
  const { data: currentBooking, error: fetchBookingError } = await supabase
    .from('bookings')
    .select('status, payment_status')
    .eq('id', bookingId)
    .single();

  if (fetchBookingError) {
    console.error(`Webhook: Error fetching booking ${bookingId} for payment_intent.succeeded:`, fetchBookingError);
    return;
  }

  if (currentBooking && currentBooking.status === 'confirmed' && currentBooking.payment_status === 'paid') {
    console.log(`Webhook: Booking ${bookingId} already confirmed and paid. Skipping update for payment_intent.succeeded.`);
    return;
  }
  
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', payment_status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (bookingError) console.error(`Webhook: Error updating booking ${bookingId} from PI success:`, bookingError);

  const { error: paymentError } = await supabase
    .from('payments')
    .update({ 
        status: 'completed', 
        receipt_url: paymentIntent.charges?.data[0]?.receipt_url || null,
        updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (paymentError) console.error(`Webhook: Error updating payment from PI success for ${paymentIntent.id}:`, paymentError);
  else console.log(`Webhook: Successfully processed payment_intent.succeeded for booking ${bookingId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId) {
    console.error('Webhook Error: No booking_id in payment_intent.payment_failed metadata', paymentIntent);
    return;
  }

  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'failed', payment_status: 'failed', updated_at: new Date().toISOString() }) // 'failed' status for booking
    .eq('id', bookingId);

  if (bookingError) console.error(`Webhook: Error updating booking ${bookingId} to failed:`, bookingError);

  const { error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('payment_intent_id', paymentIntent.id);

  if (paymentError) console.error(`Webhook: Error updating payment to failed for ${paymentIntent.id}:`, paymentError);
  else console.log(`Webhook: Successfully processed payment_intent.payment_failed for booking ${bookingId}`);
}

export const paymentsRouter = router;
