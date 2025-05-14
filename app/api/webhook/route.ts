import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { generateLicensePDF, type LicenseType } from '../../../lib/generateLicense';
import { addWebhookLog } from '../../../lib/webhookLogger';

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

// Initialize Stripe with Edge-compatible configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  httpClient: Stripe.createFetchHttpClient()
});

// Initialize Supabase client
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Helper function to validate UUIDs
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper function to generate UUIDs
const generateUUID = () => {
  return crypto.randomUUID();
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
  const isTestSession = session.id.startsWith('cs_test_');
  const customerEmail = session.customer_details?.email || '';
  const supabaseUserId = session.metadata?.user_id || null;

  let sessionWithItems = session;

  // Only retrieve expanded session from Stripe for real events
  if (!isTestSession) {
    try {
      await addWebhookLog('info', `Retrieving full session with line items`, { sessionId: session.id });
      sessionWithItems = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ['line_items.data.price.product'] }
      );
    } catch (error: any) {
      await addWebhookLog('error', `Error retrieving session details`, { 
        sessionId: session.id,
        error: error.message
      });
      throw new Error(`Cannot process webhook: unable to retrieve session ${session.id}`);
    }
  }

  const lineItems = sessionWithItems.line_items?.data || [];
  if (lineItems.length === 0) {
    await addWebhookLog('error', 'No line items found in session', { sessionId: session.id });
    throw new Error('No line items found in session');
  }

  for (const item of lineItems) {
    try {
      // Get product data
      const product = item.price?.product as Stripe.Product;
      if (!product) {
        await addWebhookLog('error', 'No product found for line item', { itemId: item.id });
        continue;
      }

      const trackId = product.metadata?.track_id || product.metadata?.itemId || generateUUID();
      const trackName = product.name || 'Unknown Track';
      const licenseType = product.metadata?.licenseType || 'Standard';

      // Create order record first
      const orderData = {
        id: generateUUID(),
        user_id: isValidUUID(supabaseUserId || '') ? supabaseUserId! : generateUUID(),
        track_id: isValidUUID(trackId) ? trackId : generateUUID(),
        track_name: trackName,
        license: licenseType,
        total_amount: (item.amount_total || 0) / 100,
        order_date: new Date().toISOString(),
        status: 'completed',
        stripe_session_id: session.id,
        customer_email: customerEmail,
        currency: session.currency?.toUpperCase() || 'USD'
      };

      // Insert order into Supabase
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to insert order: ${orderError.message}`);
      }

      console.log(`→ Inserted order record ${orderResult.id}`);
      await addWebhookLog('success', 'Inserted order record', {
        orderId: orderResult.id,
        sessionId: session.id
      });

      // Create transaction record
      const transactionData = {
        id: generateUUID(),
        order_id: orderResult.id,
        user_id: orderData.user_id,
        amount: orderData.total_amount,
        currency: orderData.currency,
        transaction_type: 'payment',
        status: 'completed' as const,
        stripe_transaction_id: session.payment_intent || session.id,
        customer_email: customerEmail,
        metadata: {
          track_id: trackId,
          track_name: trackName,
          license_type: licenseType
        }
      };

      // Insert transaction into Supabase
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (insertError) {
        throw new Error(`Failed to insert transaction: ${insertError.message}`);
      }

      console.log(`→ Inserted transaction for session ${session.id}`);
      await addWebhookLog('success', 'Inserted transaction record', {
        transactionId: transactionData.id,
        sessionId: session.id
      });

      // Generate and store license if needed
      if (licenseType !== 'Standard') {
        try {
          const effectiveDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          const licenseFile = await generateLicensePDF({
            trackTitle: trackName,
            licenseType: licenseType as LicenseType,
            effectiveDate,
            orderId: orderResult.id
          });

          // Update order with license file
          const { error: updateError } = await supabase
            .from('orders')
            .update({ license_file: licenseFile })
            .eq('id', orderResult.id);

          if (updateError) {
            throw new Error(`Failed to update order with license: ${updateError.message}`);
          }

          await addWebhookLog('success', 'Generated and stored license file', {
            orderId: orderResult.id
          });
        } catch (error: any) {
          await addWebhookLog('error', `Failed to generate/store license: ${error.message}`, {
            orderId: orderResult.id
          });
          // Continue processing - license generation failure shouldn't block the transaction
        }
      }
    } catch (error: any) {
      await addWebhookLog('error', `Error processing line item: ${error.message}`, {
        itemId: item.id,
        sessionId: session.id
      });
      throw error; // Re-throw to be caught by the main handler
    }
  }
} 