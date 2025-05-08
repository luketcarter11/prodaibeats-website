import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Modern Next.js App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature') as string;

  let event;

  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json(
        { error: 'Webhook signature or secret missing' },
        { status: 400 }
      );
    }

    // Verify webhook signature and extract the event
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Extract customer information from metadata
        const { name, email, items } = paymentIntent.metadata;
        const parsedItems = JSON.parse(items);

        // Here you would typically:
        // 1. Store the order in your database
        // 2. Send confirmation email
        // 3. Generate download links
        // 4. Update inventory/licenses

        console.log('Payment succeeded:', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          customer: { name, email },
          items: parsedItems
        });
        
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`❌ Payment failed: ${failedPaymentIntent.id}`);
        
        // Handle failed payment - notify customer, log failure, etc.
        break;
      
      // Add additional event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 