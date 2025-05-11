import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { discountService } from '@/services/discountService';
import { createClient } from '@supabase/supabase-js';
import { generateLicensePDF, LicenseType } from '../../../lib/generateLicense';

// Edge and Streaming flags
export const runtime = 'nodejs'; // Keep as nodejs for file system operations
export const dynamic = 'force-dynamic';

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Stripe credentials are not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

// Define the orders directory path
const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');

// Initialize Supabase client
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase admin credentials');
    throw new Error('Supabase admin credentials are not defined');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

async function updateOrderStatus(sessionId: string, status: 'completed' | 'failed', customerId?: string) {
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
      return null;
    }

    // Update the order status
    const orderPath = path.join(ORDERS_DIR, orderFile);
    const orderData = JSON.parse(fs.readFileSync(orderPath, 'utf-8'));
    orderData.status = status;
    
    // Update user_id if customer ID is provided
    if (customerId) {
      orderData.user_id = customerId;
    }
    
    // Write the updated order back to file
    fs.writeFileSync(orderPath, JSON.stringify(orderData, null, 2));
    
    return orderData;
  } catch (error: any) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

async function saveOrderToSupabase(orderData: any) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Include created_at and updated_at timestamps
    const now = new Date().toISOString();
    const orderWithTimestamps = {
      ...orderData,
      created_at: now,
      updated_at: now
    };
    
    // Insert order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert(orderWithTimestamps);
      
    if (error) {
      console.error('Error saving order to Supabase:', error);
      throw error;
    }
    
    console.log(`Successfully saved order ${orderData.id} to Supabase`);
    return data;
  } catch (error) {
    console.error('Error in saveOrderToSupabase:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Get customer ID from the session
    const customerId = session.customer;
    if (!customerId) {
      console.error('No customer ID found in session:', session.id);
      return;
    }
    
    console.log(`Processing completed checkout for session ${session.id}`);
    
    // Get customer email from the session
    const customerEmail = session.customer_details?.email;
    
    // Try to find the Supabase user ID by email
    let supabaseUserId = null;
    if (customerEmail) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData && userData.users) {
          const matchingUser = userData.users.find(user => 
            user.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          
          if (matchingUser) {
            supabaseUserId = matchingUser.id;
            console.log(`Found Supabase user ID ${supabaseUserId} for customer email ${customerEmail}`);
          }
        }
      } catch (error) {
        console.error('Error finding Supabase user by email:', error);
      }
    }
    
    // Get the full session details with line items
    const sessionWithItems = await stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ['line_items.data.price.product'] }
    );
    
    // Process each line item as a separate order
    const lineItems = sessionWithItems.line_items?.data || [];
    
    for (const item of lineItems) {
      const product = item.price?.product as Stripe.Product;
      const metadata = product.metadata || {};
      
      // Create order data matching Supabase schema
      const orderData = {
        id: crypto.randomUUID(), // Generate UUID for order
        user_id: supabaseUserId, // UUID from Supabase user
        order_date: new Date().toISOString(),
        total_amount: (item.amount_total || 0) / 100,
        discount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : null,
        license: metadata.license_type || 'Standard',
        track_name: product.name || 'Unknown Track',
        track_id: metadata.track_id, // UUID of the track
        license_file: null, // Will be generated and updated later
        customer_email: customerEmail || '',
        stripe_session_id: session.id,
        currency: session.currency?.toUpperCase() || 'USD',
        status: 'completed'
      };
      
      // Save order to Supabase
      await saveOrderToSupabase(orderData);
      console.log(`Saved order for track ${orderData.track_name} to Supabase`);
    }
    
    // Handle discount code usage if applicable
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        await discountService.incrementUsageCount(discountId);
        console.log(`Incremented usage count for discount code ${session.metadata?.discountCode}`);
      } catch (error) {
        console.error('Failed to increment discount code usage:', error);
      }
    }
    
    console.log(`Successfully processed completed checkout for session ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout completed webhook:', error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    // Get customer ID from the session
    const customerId = session.customer;
    if (!customerId) {
      console.error('No customer ID found in session:', session.id);
      return;
    }

    // Update order status
    await updateOrderStatus(session.id, 'failed', customerId.toString());
    
    // Get the discount code from metadata
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        // Decrement usage count in our database since the checkout failed
        await discountService.decrementUsageCount(discountId);
        
        // Log the successful decrement
        console.log(`Successfully decremented usage count for discount code ${session.metadata?.discountCode}`);
      } catch (error) {
        console.error('Failed to decrement discount code usage:', error);
        // Don't throw error here as we want to continue processing the webhook
      }
    }
  } catch (error) {
    console.error('Error handling checkout expired webhook:', error);
    throw error; // Re-throw to trigger webhook retry
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get session details
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const item = lineItems.data[0];
      
      if (!item) {
        throw new Error('No line items found in session');
      }

      const supabase = getSupabaseAdmin();

      // Get track details from metadata
      const trackId = session.metadata?.trackId;
      const trackName = session.metadata?.trackName;
      const licenseType = session.metadata?.licenseType as LicenseType;

      if (!trackId || !trackName || !licenseType || !isValidLicenseType(licenseType)) {
        throw new Error('Missing required metadata or invalid license type');
      }

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.metadata?.userId,
          track_id: trackId,
          track_name: trackName,
          license: licenseType,
          total_amount: session.amount_total! / 100,
          currency: session.currency?.toUpperCase(),
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email,
          status: 'completed'
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order');
      }

      // Generate and store the license PDF
      const effectiveDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const pdfBuffer = await generateLicensePDF({
        orderId: order.id,
        trackTitle: trackName,
        licenseType,
        effectiveDate
      });

      // Upload to Supabase storage
      const fileName = `${order.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error('Failed to upload license');
      }

      // Update order with license file path
      const { error: updateError } = await supabase
        .from('orders')
        .update({ license_file: fileName })
        .eq('id', order.id);

      if (updateError) {
        throw new Error('Failed to update order with license file');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Helper function to validate license type
function isValidLicenseType(type: string): type is LicenseType {
  return ['Non-Exclusive', 'Non-Exclusive Plus', 'Exclusive', 'Exclusive Plus', 'Exclusive Pro'].includes(type);
} 