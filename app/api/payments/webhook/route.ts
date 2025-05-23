import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream'; // For Next.js 13+ raw body with Vercel
import { handleWebhookEvent } from '../../../../backend/src/utils/stripe'; // Adjust path as needed
// Ensure stripe utility and its sub-functions (handlePaymentSucceeded, etc.)
// are refactored to use supabaseAdmin or are passed a db client.

// Helper function to buffer the request stream (for Vercel Edge/Node.js runtime)
async function buffer(readable: Readable): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    // Vercel Edge/Node.js runtime might require different raw body handling.
    // For Node.js runtime, request.text() or request.blob() then buffer might work.
    // For Edge runtime, it's more complex.
    // For simplicity and common Node.js runtime on Vercel:
    const rawBody = await request.text(); // Get raw body as text
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Stripe signature is missing' }, { status: 400 });
    }
    if (!rawBody) {
        return NextResponse.json({ error: 'Request body is missing' }, { status: 400 });
    }

    // Call the existing utility function to handle the webhook event.
    // This function is responsible for verifying the signature and processing the event,
    // including calling handlePaymentSucceeded or handlePaymentFailed.
    // It's assumed that handleWebhookEvent and its downstream functions
    // are updated to use supabaseAdmin for database operations.
    const event = await handleWebhookEvent(rawBody, signature);

    // Based on the event type, further actions might be taken here if not fully handled by handleWebhookEvent
    // For example, if handleWebhookEvent only returns the event and doesn't do DB updates itself:
    /*
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // await handlePaymentSucceeded(paymentIntent); // Ensure this uses supabaseAdmin
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // await handlePaymentFailed(paymentIntent); // Ensure this uses supabaseAdmin
    }
    */
    
    console.log("Webhook processed event:", event.type);
    return NextResponse.json({ received: true, eventType: event.type });

  } catch (error: any) {
    console.error('Stripe Webhook error:', error);
    // Errors from handleWebhookEvent (e.g., signature verification) will be caught here
    return NextResponse.json({ error: `Webhook Error: ${error.message}`, type: error.type }, { status: 400 });
  }
}
