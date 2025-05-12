import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { discountService } from '@/services/discountService';
import { createClient } from '@supabase/supabase-js';
import { generateLicensePDF, LicenseType } from '../../../lib/generateLicense';
import { addWebhookLog } from '../webhook-logs/route';

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
    console.log('Attempting to save order to Supabase:', JSON.stringify(orderData, null, 2));
    addWebhookLog('info', 'Attempting to save order to Supabase', { 
      orderId: orderData.id,
      trackId: orderData.track_id 
    });
    
    const supabase = getSupabaseAdmin();
    
    // Include created_at and updated_at timestamps
    const now = new Date().toISOString();
    const orderWithTimestamps = {
      ...orderData,
      created_at: now,
      updated_at: now
    };
    
    // Ensure discount has a default value
    if (orderWithTimestamps.discount === null || orderWithTimestamps.discount === undefined) {
      orderWithTimestamps.discount = 0;
      addWebhookLog('info', 'Setting default value for discount', { 
        orderId: orderData.id,
        discount: 0
      });
    }
    
    addWebhookLog('debug', 'Order data with timestamps', orderWithTimestamps);
    
    // Validate required fields
    const requiredFields = ['id', 'track_id', 'track_name', 'total_amount', 'status'];
    const missingFields = requiredFields.filter(field => !orderWithTimestamps[field]);
    
    // Special handling for user_id - generate a fallback if missing
    if (!orderWithTimestamps.user_id) {
      addWebhookLog('warning', 'No user_id found, generating fallback anonymous user ID', {
        customerEmail: orderWithTimestamps.customer_email || 'unknown'
      });
      orderWithTimestamps.user_id = crypto.randomUUID();
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMsg);
      addWebhookLog('error', errorMsg, { orderData });
      throw new Error(errorMsg);
    }
    
    // Validate UUID fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuidFields = ['id', 'user_id', 'track_id'];
    for (const field of uuidFields) {
      if (orderWithTimestamps[field] && !uuidRegex.test(orderWithTimestamps[field])) {
        const errorMsg = `Invalid UUID format for field ${field}: ${orderWithTimestamps[field]}`;
        console.error(errorMsg);
        addWebhookLog('error', errorMsg, { [field]: orderWithTimestamps[field] });
        
        // Generate fallback UUID for invalid fields
        orderWithTimestamps[field] = crypto.randomUUID();
        addWebhookLog('warning', `Generated fallback UUID for ${field}`, { 
          original: orderWithTimestamps[field],
          new: orderWithTimestamps[field]
        });
      }
    }
    
    // Insert order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert(orderWithTimestamps);
      
    if (error) {
      console.error('Error saving order to Supabase:', error);
      // Log detailed error information
      addWebhookLog('error', `Error saving order to Supabase: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        orderId: orderData.id
      });
      throw error;
    }
    
    console.log(`Successfully saved order ${orderData.id} to Supabase`);
    addWebhookLog('success', `Successfully saved order ${orderData.id} to Supabase`);
    return data;
  } catch (error) {
    console.error('Error in saveOrderToSupabase:', error);
    addWebhookLog('error', `Error in saveOrderToSupabase: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      error: error instanceof Error ? error.stack : error,
      orderData: {
        id: orderData.id,
        track_id: orderData.track_id,
        user_id: orderData.user_id
      }
    });
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Get customer ID from the session
    const customerId = session.customer;
    if (!customerId) {
      console.error('No customer ID found in session:', session.id);
      addWebhookLog('error', 'No customer ID found in session', { sessionId: session.id });
      return;
    }
    
    console.log(`Processing completed checkout for session ${session.id}`);
    console.log(`Customer ID: ${customerId}`);
    addWebhookLog('info', `Processing completed checkout`, { 
      sessionId: session.id,
      customerId: customerId
    });
    
    // Session debug data
    addWebhookLog('debug', 'Session data', {
      id: session.id,
      amount_total: session.amount_total,
      customer_details: session.customer_details,
      metadata: session.metadata,
      payment_status: session.payment_status
    });
    
    // Get customer email from the session
    const customerEmail = session.customer_details?.email;
    
    // Try to find the Supabase user ID by email
    let supabaseUserId = null;
    if (customerEmail) {
      try {
        console.log(`Looking up Supabase user ID for email: ${customerEmail}`);
        addWebhookLog('info', `Looking up Supabase user ID for email`, { email: customerEmail });
        
        const supabase = getSupabaseAdmin();
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData && userData.users) {
          const matchingUser = userData.users.find(user => 
            user.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          
          if (matchingUser) {
            supabaseUserId = matchingUser.id;
            console.log(`Found Supabase user ID ${supabaseUserId} for customer email ${customerEmail}`);
            addWebhookLog('success', `Found Supabase user ID for customer email`, { 
              email: customerEmail,
              userId: supabaseUserId 
            });
          } else {
            console.log(`No matching Supabase user found for email ${customerEmail}`);
            addWebhookLog('warning', `No matching Supabase user found for email`, { email: customerEmail });
          }
        } else {
          console.error('Error or no data when fetching users:', userError);
          addWebhookLog('error', 'Error fetching users from Supabase', { error: userError });
        }
      } catch (error) {
        console.error('Error finding Supabase user by email:', error);
        addWebhookLog('error', 'Error finding Supabase user by email', { error: error });
      }
    }
    
    // Handle test sessions vs real sessions differently
    let sessionWithItems = session;
    const isTestSession = session.id.startsWith('cs_test_');
    
    addWebhookLog('info', `Session type: ${isTestSession ? 'Test Session' : 'Real Session'}`, { sessionId: session.id });
    
    // Only retrieve expanded session from Stripe for real events (not our test ones)
    if (!isTestSession) {
      try {
        addWebhookLog('info', `Retrieving full session with line items`, { sessionId: session.id });
        sessionWithItems = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items.data.price.product'] }
        );
      } catch (retrieveError) {
        console.error(`Error retrieving session details: ${retrieveError instanceof Error ? retrieveError.message : 'Unknown error'}`);
        addWebhookLog('error', `Error retrieving session details`, { 
          sessionId: session.id,
          error: retrieveError instanceof Error ? retrieveError.message : 'Unknown error'
        });
        throw new Error(`Cannot process webhook: unable to retrieve session ${session.id}`);
      }
    }
    
    // Process each line item as a separate order
    const lineItems = sessionWithItems.line_items?.data || [];
    console.log(`Found ${lineItems.length} line items in session`);
    addWebhookLog('info', `Found line items in session`, { 
      count: lineItems.length,
      sessionId: session.id 
    });
    
    if (lineItems.length === 0) {
      console.error('No line items found in session:', session.id);
      addWebhookLog('error', 'No line items found in session', { sessionId: session.id });
      return;
    }
    
    for (const item of lineItems) {
      try {
        console.log(`Processing line item:`, JSON.stringify({
          id: item.id,
          description: item.description,
          amount_total: item.amount_total,
          price: item.price?.id
        }, null, 2));
        
        addWebhookLog('info', `Processing line item`, {
          itemId: item.id,
          description: item.description,
          amount_total: item.amount_total
        });
        
        // Get product data either from the expanded field or directly 
        let productData: any = {};
        let trackId: string = '';
        let trackName: string = '';
        let licenseType: string = 'Standard';
        
        if (isTestSession) {
          // For test sessions, we get data from the item.price.product field directly
          const product = item.price?.product as Stripe.Product;
          if (product) {
            productData = product;
            trackId = product.metadata?.track_id || product.metadata?.itemId || '';
            trackName = product.name || 'Unknown Track';
            licenseType = product.metadata?.licenseType || 'Standard';
          } else {
            addWebhookLog('warning', 'No product found in test session, checking metadata', { itemId: item.id });
            
            // Try to get data from session metadata
            if (session.metadata?.items) {
              try {
                const items = JSON.parse(session.metadata.items);
                if (items && items.length > 0) {
                  const firstItem = items[0];
                  trackId = firstItem.id || firstItem.track_id || '';
                  trackName = firstItem.title || 'Unknown Track';
                  licenseType = firstItem.licenseType || 'Standard';
                  
                  addWebhookLog('info', 'Retrieved item data from session metadata', {
                    trackId,
                    trackName,
                    licenseType
                  });
                }
              } catch (parseError) {
                addWebhookLog('error', 'Failed to parse items from session metadata', { 
                  error: parseError,
                  metadata: session.metadata
                });
              }
            }
          }
        } else {
          // For real sessions, we access the product data from the expanded field
          const product = item.price?.product as Stripe.Product;
          if (!product) {
            console.error('No product found for line item:', item.id);
            addWebhookLog('error', 'No product found for line item', { itemId: item.id });
            continue;
          }
          
          productData = product;
          trackId = product.metadata?.track_id || product.metadata?.itemId || '';
          trackName = product.name || 'Unknown Track';
          licenseType = product.metadata?.licenseType || 'Standard';
        }
        
        addWebhookLog('debug', 'Product data', {
          trackId,
          trackName,
          licenseType
        });
        
        // Validate trackId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!trackId || !uuidRegex.test(trackId)) {
          addWebhookLog('error', 'Invalid track_id format', { trackId });
          // Generate a valid UUID as fallback
          trackId = crypto.randomUUID();
          addWebhookLog('warning', 'Generated a fallback UUID for track_id', { newTrackId: trackId });
        }
        
        // Create order data matching Supabase schema
        const orderData = {
          id: crypto.randomUUID(), // Generate UUID for order
          user_id: supabaseUserId, // UUID from Supabase user
          track_id: trackId,
          track_name: trackName,
          license: licenseType,
          order_date: new Date().toISOString(),
          total_amount: (item.amount_total || 0) / 100,
          discount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0,
          license_file: null, // Will be generated and updated later
          customer_email: customerEmail || '',
          stripe_session_id: session.id,
          currency: session.currency?.toUpperCase() || 'USD',
          status: 'completed'
        };
        
        console.log(`Order data to be saved:`, JSON.stringify(orderData, null, 2));
        addWebhookLog('debug', 'Order data to be saved', orderData);
        
        // Save order to Supabase
        try {
          await saveOrderToSupabase(orderData);
          console.log(`Saved order for track ${orderData.track_name} to Supabase`);
          addWebhookLog('success', `Saved order to Supabase`, { 
            orderId: orderData.id,
            trackId: orderData.track_id,
            trackName: orderData.track_name 
          });
        } catch (saveError) {
          console.error('Error saving order to Supabase:', saveError);
          addWebhookLog('error', 'Error saving order to Supabase', { 
            error: saveError,
            orderData
          });
          continue;
        }
        
        // Generate license if this is a valid license type
        if (isValidLicenseType(orderData.license)) {
          try {
            console.log(`Generating license for order ${orderData.id}`);
            addWebhookLog('info', `Generating license for order`, { 
              orderId: orderData.id,
              licenseType: orderData.license 
            });
            
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
              orderId: orderData.id,
              trackTitle: orderData.track_name,
              licenseType: orderData.license as LicenseType,
              effectiveDate
            });

            // Upload to Supabase storage
            const fileName = `${orderData.id}.pdf`;
            const supabase = getSupabaseAdmin();
            const { error: uploadError } = await supabase.storage
              .from('licenses')
              .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
              });

            if (uploadError) {
              console.error('Failed to upload license:', uploadError);
              addWebhookLog('error', 'Failed to upload license', { 
                orderId: orderData.id,
                error: uploadError 
              });
            } else {
              // Update order with license file path
              const { error: updateError } = await supabase
                .from('orders')
                .update({ license_file: fileName })
                .eq('id', orderData.id);

              if (updateError) {
                console.error('Failed to update order with license file:', updateError);
                addWebhookLog('error', 'Failed to update order with license file', { 
                  orderId: orderData.id,
                  error: updateError 
                });
              } else {
                console.log(`Generated and attached license file for order ${orderData.id}`);
                addWebhookLog('success', 'Generated and attached license file', { 
                  orderId: orderData.id,
                  fileName 
                });
              }
            }
          } catch (licenseError) {
            console.error('Error generating license:', licenseError);
            addWebhookLog('error', 'Error generating license', { 
              orderId: orderData.id, 
              error: licenseError 
            });
          }
        } else {
          console.log(`License type "${orderData.license}" is not valid for generating a license file`);
          addWebhookLog('warning', 'Invalid license type for license generation', { 
            licenseType: orderData.license,
            orderId: orderData.id 
          });
        }
      } catch (itemError) {
        console.error('Error processing line item:', itemError);
        addWebhookLog('error', 'Error processing line item', { error: itemError });
      }
    }
    
    // Handle discount code usage if applicable
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        await discountService.incrementUsageCount(discountId);
        console.log(`Incremented usage count for discount code ${session.metadata?.discountCode}`);
        addWebhookLog('success', 'Incremented discount code usage count', { 
          discountId,
          discountCode: session.metadata?.discountCode 
        });
      } catch (error) {
        console.error('Failed to increment discount code usage:', error);
        addWebhookLog('error', 'Failed to increment discount code usage', { 
          discountId,
          error 
        });
      }
    }
    
    addWebhookLog('success', 'Successfully processed checkout completion', { sessionId: session.id });
    console.log(`Successfully processed completed checkout for session ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout completed webhook:', error);
    addWebhookLog('error', 'Error handling checkout completed webhook', { error });
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
    console.log('Received webhook request');
    addWebhookLog('info', 'Received webhook request');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature provided');
      addWebhookLog('error', 'No Stripe signature provided');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    console.log('Validating Stripe webhook signature');
    addWebhookLog('info', 'Validating Stripe webhook signature');
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      addWebhookLog('error', `Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event type: ${event.type}`);
    addWebhookLog('info', `Processing webhook event type: ${event.type}`, { 
      eventId: event.id,
      eventType: event.type
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout.session.completed for session ${session.id}`);
      addWebhookLog('info', `Processing checkout.session.completed`, { 
        sessionId: session.id, 
        customerEmail: session.customer_details?.email 
      });
      
      try {
        await handleCheckoutCompleted(session);
        console.log(`Successfully processed checkout.session.completed for session ${session.id}`);
        addWebhookLog('success', `Successfully processed checkout.session.completed`, { sessionId: session.id });
      } catch (error: any) {
        console.error(`Error processing checkout.session.completed webhook:`, error);
        console.error('Detailed error:', error.stack || error);
        addWebhookLog('error', `Error processing checkout.session.completed webhook: ${error.message}`, {
          sessionId: session.id,
          error: error.stack || error.toString()
        });
        
        // Return 200 status to avoid Stripe retries, but log the error
        return NextResponse.json({ 
          received: true, 
          warning: 'Webhook processed but encountered an error',
          error: error.message
        });
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout.session.expired for session ${session.id}`);
      addWebhookLog('info', `Processing checkout.session.expired`, { sessionId: session.id });
      
      try {
        await handleCheckoutExpired(session);
        console.log(`Successfully processed checkout.session.expired for session ${session.id}`);
        addWebhookLog('success', `Successfully processed checkout.session.expired`, { sessionId: session.id });
      } catch (error: any) {
        console.error(`Error processing checkout.session.expired webhook:`, error);
        addWebhookLog('error', `Error processing checkout.session.expired webhook: ${error.message}`, {
          sessionId: session.id,
          error: error.stack || error.toString() 
        });
        
        // Return 200 status to avoid Stripe retries, but log the error
        return NextResponse.json({ 
          received: true, 
          warning: 'Webhook processed but encountered an error',
          error: error.message
        });
      }
    } else {
      console.log(`Ignoring unhandled event type: ${event.type}`);
      addWebhookLog('warning', `Ignoring unhandled event type: ${event.type}`);
    }

    addWebhookLog('success', 'Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook unhandled error:', error);
    console.error('Error stack:', error.stack || 'No stack trace available');
    addWebhookLog('error', `Webhook unhandled error: ${error.message}`, {
      error: error.stack || error.toString()
    });
    
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 400 }
    );
  }
}

// Helper function to validate license type
function isValidLicenseType(type: string): type is LicenseType {
  return ['Non-Exclusive', 'Non-Exclusive Plus', 'Exclusive', 'Exclusive Plus', 'Exclusive Pro'].includes(type);
} 