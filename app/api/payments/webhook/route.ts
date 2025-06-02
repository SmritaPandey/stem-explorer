import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import Stripe from 'stripe';
import supabaseAdmin from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function buffer(readable: Readable): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        const sessionId = session.metadata?.sessionId;

        if (!bookingId) {
          throw new Error('No bookingId in session metadata');
        }

        // Update booking status
        const { error: bookingError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'Confirmed',
            payment_status: 'paid',
            payment_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (bookingError) {
          console.error('Error updating booking:', bookingError);
          throw bookingError;
        }

        // Update session capacity if applicable
        if (sessionId) {
          const { data: sessionData, error: sessionFetchError } = await supabaseAdmin
            .from('program_sessions')
            .select('current_capacity')
            .eq('id', sessionId)
            .single();

          if (sessionFetchError) {
            console.error('Error fetching session:', sessionFetchError);
            throw sessionFetchError;
          }

          const { error: sessionUpdateError } = await supabaseAdmin
            .from('program_sessions')
            .update({
              current_capacity: (sessionData.current_capacity || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

          if (sessionUpdateError) {
            console.error('Error updating session capacity:', sessionUpdateError);
            throw sessionUpdateError;
          }
        }

        break;
      }

      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          const { error: bookingError } = await supabaseAdmin
            .from('bookings')
            .update({
              status: 'Failed',
              payment_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

          if (bookingError) {
            console.error('Error updating failed booking:', bookingError);
            throw bookingError;
          }
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}