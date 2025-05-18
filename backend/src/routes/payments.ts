import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/auth';
import pool from '../db';
import { 
  createPaymentIntent, 
  createCheckoutSession, 
  handleWebhookEvent 
} from '../utils/stripe';

const router = express.Router();

const paymentIntentSchema = z.object({
  programId: z.number(),
  bookingId: z.number().optional(),
});

const checkoutSessionSchema = z.object({
  programId: z.number(),
});

/**
 * @route POST /api/payments/create-intent
 * @desc Create a payment intent for a program
 * @access Private
 */
router.post('/create-intent', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { programId, bookingId } = paymentIntentSchema.parse(req.body);
    const user = req.user as any;

    // Get program details
    const programResult = await pool.query(
      'SELECT id, title, price FROM programs WHERE id = $1',
      [programId]
    );

    if (programResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    const program = programResult.rows[0];
    
    // Create or get booking
    let booking;
    
    if (bookingId) {
      // Verify booking exists and belongs to user
      const bookingResult = await pool.query(
        'SELECT id, status FROM bookings WHERE id = $1 AND user_id = $2',
        [bookingId, user.id]
      );
      
      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }
      
      booking = bookingResult.rows[0];
      
      // Check if booking is already paid
      if (booking.status === 'Confirmed') {
        return res.status(400).json({
          success: false,
          error: 'Booking is already paid'
        });
      }
    } else {
      // Create new booking
      const bookingResult = await pool.query(
        'INSERT INTO bookings (user_id, program_id, status) VALUES ($1, $2, $3) RETURNING id, status',
        [user.id, programId, 'Pending']
      );
      
      booking = bookingResult.rows[0];
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      program.price,
      'usd',
      {
        programId: program.id.toString(),
        bookingId: booking.id.toString(),
        userId: user.id.toString()
      }
    );

    // Store payment intent in database
    await pool.query(
      `INSERT INTO payments (
        booking_id, amount, currency, status, payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        booking.id,
        program.price,
        'usd',
        'pending',
        paymentIntent.id
      ]
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        bookingId: booking.id
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else {
      console.error('Payment intent creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
});

/**
 * @route POST /api/payments/create-checkout
 * @desc Create a Stripe Checkout session for a program
 * @access Private
 */
router.post('/create-checkout', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { programId } = checkoutSessionSchema.parse(req.body);
    const user = req.user as any;

    // Get program details
    const programResult = await pool.query(
      'SELECT id, title, price FROM programs WHERE id = $1',
      [programId]
    );

    if (programResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    const program = programResult.rows[0];
    
    // Create booking
    const bookingResult = await pool.query(
      'INSERT INTO bookings (user_id, program_id, status) VALUES ($1, $2, $3) RETURNING id',
      [user.id, programId, 'Pending']
    );
    
    const booking = bookingResult.rows[0];

    // Create checkout session
    const session = await createCheckoutSession(
      program.id,
      program.title,
      program.price,
      user.id,
      `${process.env.FRONTEND_URL}/dashboard/bookings/success?booking_id=${booking.id}`,
      `${process.env.FRONTEND_URL}/dashboard/bookings/cancel?booking_id=${booking.id}`
    );

    // Store checkout session in database
    await pool.query(
      `INSERT INTO payments (
        booking_id, amount, currency, status, payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        booking.id,
        program.price,
        'usd',
        'pending',
        session.payment_intent as string || ''
      ]
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else {
      console.error('Checkout session creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
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
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Stripe signature is missing'
      });
    }

    const event = await handleWebhookEvent(
      req.body,
      signature
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as any);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as any);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook error'
    });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const { bookingId } = paymentIntent.metadata;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update booking status
    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['Confirmed', bookingId]
    );

    // Update payment status
    await pool.query(
      'UPDATE payments SET status = $1, receipt_url = $2 WHERE payment_intent_id = $3',
      ['completed', paymentIntent.charges?.data[0]?.receipt_url || null, paymentIntent.id]
    );
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    const { bookingId } = paymentIntent.metadata;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update booking status
    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['Failed', bookingId]
    );

    // Update payment status
    await pool.query(
      'UPDATE payments SET status = $1 WHERE payment_intent_id = $2',
      ['failed', paymentIntent.id]
    );
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

export const paymentsRouter = router;
