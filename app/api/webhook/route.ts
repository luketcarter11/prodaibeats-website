import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateLicensePDF, type LicenseType } from '../../../lib/generateLicense';
import { isValidUUID } from '../../../lib/utils';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';
import { addWebhookLog } from '../../../lib/webhook-logger';
import { stripe } from '../../../lib/stripe';
import type { Stripe } from 'stripe';

// Set the runtime to edge for better performance
export const runtime = 'edge';

// Validate required environment variables
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Generate UUID using Web Crypto API
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers (should never be needed in Edge Runtime)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export async function POST(request: NextRequest) {
  try {
    console.log('Received webhook request');
    await addWebhookLog('info', 'Received webhook request');

    // Get the raw body as text for signature verification
    const rawBody = await request.text();
    
    // Get signature from request headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature provided');
      await addWebhookLog('error', 'No Stripe signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    console.log('Validating Stripe webhook signature');
    await addWebhookLog('info', 'Validating Stripe webhook signature');

    let event: Stripe.Event;
    try {
      // Use constructEventAsync for Edge compatibility
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log('✅ Verified webhook event:', event.type);
      await addWebhookLog('success', 'Verified webhook signature', { eventType: event.type });
    } catch (err: any) {
      console.error('🚨 Webhook signature verification failed:', err.message);
      await addWebhookLog('error', `Webhook signature verification failed: ${err.message}`, {
        providedSignature: signature
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different types of events
    const session = event.data.object as Stripe.Checkout.Session;
    
    switch (event.type) {
      case 'checkout.session.completed':
        try {
          await handleCheckoutCompleted(session);
          console.log(`Successfully processed checkout.session.completed for session ${session.id}`);
          await addWebhookLog('success', `Successfully processed checkout.session.completed`, { sessionId: session.id });
        } catch (error: any) {
          console.error(`Error processing checkout.session.completed webhook:`, error);
          await addWebhookLog('error', `Error processing checkout.session.completed webhook: ${error.message}`, {
            sessionId: session.id,
            error: error.stack || error.toString()
          });
          // Return 200 to acknowledge receipt (prevent retries) but include error details
          return NextResponse.json({ 
            received: true, 
            warning: 'Webhook processed but encountered an error',
            error: error.message
          });
        }
        break;

      // Add other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
        await addWebhookLog('info', `Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    await addWebhookLog('error', `Webhook processing error: ${error.message}`, {
      error: error.stack || error.toString()
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin();
  const customerEmail = session.customer_details?.email;
  const supabaseUserId = session.metadata?.userId;

  if (!customerEmail) {
    await addWebhookLog('error', 'No customer email found in session', { sessionId: session.id });
    return;
  }

  // Get line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  for (const item of lineItems.data) {
    try {
      // Get product data
      const product = item.price?.product as Stripe.Product;
      if (!product) {
        await addWebhookLog('error', 'No product found for line item', { itemId: item.id });
        continue;
      }

      const trackId = product.metadata?.track_id || product.metadata?.itemId || generateUUID();
      const trackName = product.name || 'Unknown Track';
      const licenseType = (product.metadata?.licenseType || 'Standard') as LicenseType;

      // Create transaction record
      const transactionData = {
        id: generateUUID(),
        user_id: isValidUUID(supabaseUserId || '') ? supabaseUserId! : generateUUID(),
        order_id: null,
        amount: (item.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'USD',
        transaction_type: 'payment',
        status: 'completed',
        stripe_transaction_id: session.payment_intent as string,
        stripe_session_id: session.id,
        customer_email: customerEmail,
        license_type: licenseType,
        metadata: {
          track_id: trackId,
          track_name: trackName,
          license_file: null
        }
      };

      // Insert transaction into Supabase
      const { data: transactionResult, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        throw new Error(`Failed to insert transaction: ${transactionError.message}`);
      }

      console.log(`→ Inserted transaction record ${transactionResult.id}`);
      await addWebhookLog('success', 'Inserted transaction record', {
        transactionId: transactionResult.id,
        sessionId: session.id
      });

      // Generate and store license file if needed
      if (transactionResult.status === 'completed') {
        try {
          const licenseFile = await generateLicensePDF({
            trackTitle: trackName,
            licenseType,
            effectiveDate: new Date().toISOString(),
            orderId: transactionResult.id
          });

          // Update transaction with license file
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              metadata: {
                ...transactionResult.metadata,
                license_file: licenseFile
              }
            })
            .eq('id', transactionResult.id);

          if (updateError) {
            console.error('Failed to update transaction with license file:', updateError);
          }
        } catch (licenseError) {
          console.error('Failed to generate license:', licenseError);
        }
      }
    } catch (error) {
      console.error('Error processing line item:', error);
      await addWebhookLog('error', 'Failed to process line item', {
        error: (error as Error).message,
        sessionId: session.id
      });
    }
  }
} 