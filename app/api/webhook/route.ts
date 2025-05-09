import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { discountService } from '@/services/discountService';

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Stripe credentials are not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

// Define the orders directory path
const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');

async function updateOrderStatus(sessionId: string, status: 'completed' | 'failed') {
  try {
    // Read all files in the orders directory
    const files = fs.readdirSync(ORDERS_DIR);
    
    // Find the order file that matches the session ID
    const orderFile = files.find(file => {
      const orderData = JSON.parse(fs.readFileSync(path.join(ORDERS_DIR, file), 'utf-8'));
      return orderData.stripe_session_id === sessionId;
    });

    if (!orderFile) {
      console.error(`No order found for session ID: ${sessionId}`);
      return;
    }

    // Update the order status
    const orderPath = path.join(ORDERS_DIR, orderFile);
    const orderData = JSON.parse(fs.readFileSync(orderPath, 'utf-8'));
    orderData.status = status;
    
    // Write the updated order back to file
    fs.writeFileSync(orderPath, JSON.stringify(orderData, null, 2));
  } catch (error: any) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  await updateOrderStatus(session.id, 'completed');
  
  // Update discount code usage if one was used
  const discountCode = session.metadata?.discountCode;
  if (discountCode) {
    try {
      await discountService.incrementUsageCount(discountCode);
    } catch (error) {
      console.error('Failed to increment discount code usage:', error);
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  await updateOrderStatus(session.id, 'failed');
  
  // If we previously incremented the usage count, we should decrement it
  const discountCode = session.metadata?.discountCode;
  if (discountCode) {
    try {
      await discountService.decrementUsageCount(discountCode);
    } catch (error) {
      console.error('Failed to decrement discount code usage:', error);
    }
  }
}

// Modern Next.js App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      
      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(expiredSession);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 