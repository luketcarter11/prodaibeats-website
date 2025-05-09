import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { discountService } from '@/services/discountService';
import { createClient } from '@supabase/supabase-js';

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
      created_at: orderData.created_at || now,
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
    
    // Important: Stripe customer IDs (cus_xxx) are not the same as Supabase user IDs (auth.uid)
    // We need to find the associated Supabase user ID for this customer
    let userId = null;
    let supabaseUserId = null;
    
    // Get customer email from the session
    const customerEmail = session.customer_details?.email;
    
    if (customerEmail) {
      try {
        // Try to find the Supabase user ID by email
        const supabase = getSupabaseAdmin();
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData && userData.users) {
          // Find user with matching email
          const matchingUser = userData.users.find(user => 
            user.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          
          if (matchingUser) {
            supabaseUserId = matchingUser.id;
            console.log(`Found Supabase user ID ${supabaseUserId} for customer email ${customerEmail}`);
          }
        }
        
        if (!supabaseUserId) {
          console.log(`No Supabase user found for email ${customerEmail}`);
        }
      } catch (error) {
        console.error('Error finding Supabase user by email:', error);
      }
    }
    
    // Use the Supabase user ID if found, otherwise fall back to Stripe customer ID
    userId = supabaseUserId || customerId.toString();
    
    // Update order status in file system and get order data
    const orderData = await updateOrderStatus(session.id, 'completed', customerId.toString());
    
    if (!orderData) {
      console.error(`No order data found for session ID: ${session.id}`);
      
      // Try to retrieve order details from stripe session metadata
      const sessionWithExpanded = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ['line_items', 'line_items.data.price.product'] }
      );
      
      if (sessionWithExpanded.line_items?.data?.length) {
        // Create a new order record if we can't find an existing one
        const lineItem = sessionWithExpanded.line_items.data[0];
        const productName = typeof lineItem.price?.product === 'object' 
          ? ('name' in lineItem.price.product ? lineItem.price.product.name : 'Unknown Product')
          : 'Unknown Product';
          
        const newOrderData = {
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          customer_email: customerEmail,
          track_id: lineItem.id,
          track_name: productName,
          license: session.metadata?.license || 'Standard',
          total_amount: session.amount_total ? session.amount_total / 100 : 0,
          stripe_session_id: session.id,
          order_date: new Date().toISOString(),
          status: 'completed',
          currency: session.currency?.toUpperCase() || 'USD'
        };
        
        // Save reconstructed order to Supabase
        await saveOrderToSupabase(newOrderData);
        console.log(`Created new order for session ${session.id} with user ID ${userId}`);
      } else {
        console.error('Unable to reconstruct order data from session');
      }
    } else {
      // Update user_id to use Supabase user ID if available
      orderData.user_id = userId;
      
      // Add customer email to the order data if available
      if (customerEmail) {
        orderData.customer_email = customerEmail;
      }
      
      // Add currency to order data if available
      if (session.currency) {
        orderData.currency = session.currency.toUpperCase();
      }
      
      // Save order to Supabase
      await saveOrderToSupabase(orderData);
      console.log(`Updated order for session ${session.id} with user ID ${userId}`);
    }
    
    // Get the discount code from metadata
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        // Increment usage count in our database
        await discountService.incrementUsageCount(discountId);
        
        // Log the successful usage
        console.log(`Successfully incremented usage count for discount code ${session.metadata?.discountCode}`);
      } catch (error) {
        console.error('Failed to increment discount code usage:', error);
        // Don't throw error here as we want to continue processing the webhook
      }
    }
    
    console.log(`Successfully processed completed checkout for session ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout completed webhook:', error);
    throw error; // Re-throw to trigger webhook retry
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