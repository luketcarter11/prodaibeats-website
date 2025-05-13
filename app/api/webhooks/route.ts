import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { discountService } from '@/services/discountService';
import { createClient } from '@supabase/supabase-js';
import { generateLicensePDF, LicenseType } from '../../../lib/generateLicense';
import { addWebhookLog } from '../../../lib/webhookLogger';
import { transactionService } from '../../../services/transactionService';
import type { Database } from '@/types/supabase';
type TransactionType = Database['public']['Tables']['transactions']['Row']['transaction_type'];
type TransactionStatus = Database['public']['Tables']['transactions']['Row']['status'];

// Set the runtime to edge for better performance
export const runtime = 'edge' as const;
export const dynamic = 'force-dynamic';

// Use the webhook secret provided
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_RUsVXPKctLEQ9s9vvQIDAXCbeLhNbuzh';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Stripe API key is not defined');
}

// Initialize Stripe with Edge-compatible configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  httpClient: Stripe.createFetchHttpClient()
});

// Initialize Supabase client
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase admin credentials');
    addWebhookLog('error', 'Missing Supabase admin credentials');
    throw new Error('Supabase admin credentials are not defined');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

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

// Add UUID validation helper
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

async function updateOrderStatus(sessionId: string, status: 'completed' | 'failed', customerId?: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Find the order by session ID
    const { data: orders, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();
      
    if (findError || !orders) {
      console.error(`No order found for session ID: ${sessionId}`);
      await addWebhookLog('warning', 'No order found for session ID', { sessionId });
      return null;
    }

    // Update the order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status,
        user_id: customerId || orders.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', sessionId);
      
    if (updateError) {
      console.error('Error updating order status:', updateError);
      await addWebhookLog('error', `Failed to update order status: ${updateError.message}`, { error: updateError });
      throw updateError;
    }
    
    return orders;
  } catch (error: any) {
    console.error('Error updating order status:', error);
    await addWebhookLog('error', `Failed to update order status: ${error.message}`, { error });
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

async function saveOrderToSupabase(orderData: any) {
  try {
    console.log('Attempting to save order to Supabase:', JSON.stringify(orderData, null, 2));
    await addWebhookLog('info', 'Attempting to save order to Supabase', { 
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
      await addWebhookLog('info', 'Setting default value for discount', { 
        orderId: orderData.id,
        discount: 0
      });
    }
    
    await addWebhookLog('debug', 'Order data with timestamps', orderWithTimestamps);
    
    // Validate required fields
    const requiredFields = ['id', 'track_id', 'track_name', 'total_amount', 'status'];
    const missingFields = requiredFields.filter(field => !orderWithTimestamps[field]);
    
    // Special handling for user_id - generate a fallback if missing
    if (!orderWithTimestamps.user_id) {
      await addWebhookLog('warning', 'No user_id found, generating fallback anonymous user ID', {
        customerEmail: orderWithTimestamps.customer_email || 'unknown'
      });
      orderWithTimestamps.user_id = generateUUID();
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMsg);
      await addWebhookLog('error', errorMsg, { orderData });
      throw new Error(errorMsg);
    }
    
    // Validate UUID fields
    const uuidFields = ['id', 'user_id', 'track_id'];
    for (const field of uuidFields) {
      if (orderWithTimestamps[field] && !isValidUUID(orderWithTimestamps[field])) {
        const errorMsg = `Invalid UUID format for field ${field}: ${orderWithTimestamps[field]}`;
        console.error(errorMsg);
        await addWebhookLog('error', errorMsg, { [field]: orderWithTimestamps[field] });
        
        // Generate fallback UUID for invalid fields
        orderWithTimestamps[field] = generateUUID();
        await addWebhookLog('warning', `Generated fallback UUID for ${field}`, { 
          original: orderWithTimestamps[field],
          new: orderWithTimestamps[field]
        });
      }
    }
    
    // Insert order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert(orderWithTimestamps)
      .select();
      
    if (error) {
      console.error('Error saving order to Supabase:', error);
      await addWebhookLog('error', `Error saving order to Supabase: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        orderId: orderData.id,
        orderData: orderWithTimestamps
      });
      throw error;
    }
    
    console.log(`Successfully saved order ${orderData.id} to Supabase`);
    await addWebhookLog('success', `Successfully saved order ${orderData.id} to Supabase`);
    return data;
  } catch (error) {
    console.error('Error in saveOrderToSupabase:', error);
    await addWebhookLog('error', `Error in saveOrderToSupabase: ${error instanceof Error ? error.message : 'Unknown error'}`, {
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
      await addWebhookLog('error', 'No customer ID found in session', { sessionId: session.id });
      return;
    }
    
    console.log(`Processing completed checkout for session ${session.id}`);
    console.log(`Customer ID: ${customerId}`);
    await addWebhookLog('info', `Processing completed checkout`, { 
      sessionId: session.id,
      customerId: customerId
    });
    
    // Session debug data
    await addWebhookLog('debug', 'Session data', {
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
        await addWebhookLog('info', `Looking up Supabase user ID for email`, { email: customerEmail });
        
        const supabase = getSupabaseAdmin();
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData && userData.users) {
          const matchingUser = userData.users.find(user => 
            user.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          
          if (matchingUser) {
            supabaseUserId = matchingUser.id;
            console.log(`Found Supabase user ID ${supabaseUserId} for customer email ${customerEmail}`);
            await addWebhookLog('success', `Found Supabase user ID for customer email`, { 
              email: customerEmail,
              userId: supabaseUserId 
            });
          } else {
            console.log(`No matching Supabase user found for email ${customerEmail}`);
            await addWebhookLog('warning', `No matching Supabase user found for email`, { email: customerEmail });
          }
        } else {
          console.error('Error or no data when fetching users:', userError);
          await addWebhookLog('error', 'Error fetching users from Supabase', { error: userError });
        }
      } catch (error) {
        console.error('Error finding Supabase user by email:', error);
        await addWebhookLog('error', 'Error finding Supabase user by email', { error: error });
      }
    }
    
    // Handle test sessions vs real sessions differently
    let sessionWithItems = session;
    const isTestSession = session.id.startsWith('cs_test_');
    
    await addWebhookLog('info', `Session type: ${isTestSession ? 'Test Session' : 'Real Session'}`, { sessionId: session.id });
    
    // Only retrieve expanded session from Stripe for real events (not our test ones)
    if (!isTestSession) {
      try {
        await addWebhookLog('info', `Retrieving full session with line items`, { sessionId: session.id });
        sessionWithItems = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items.data.price.product'] }
        );
      } catch (retrieveError) {
        console.error(`Error retrieving session details: ${retrieveError instanceof Error ? retrieveError.message : 'Unknown error'}`);
        await addWebhookLog('error', `Error retrieving session details`, { 
          sessionId: session.id,
          error: retrieveError instanceof Error ? retrieveError.message : 'Unknown error'
        });
        throw new Error(`Cannot process webhook: unable to retrieve session ${session.id}`);
      }
    }
    
    // Process each line item as a separate order and transaction
    const lineItems = sessionWithItems.line_items?.data || [];
    console.log(`Found ${lineItems.length} line items in session`);
    await addWebhookLog('info', `Found line items in session`, { 
      count: lineItems.length,
      sessionId: session.id 
    });
    
    if (lineItems.length === 0) {
      console.error('No line items found in session:', session.id);
      await addWebhookLog('error', 'No line items found in session', { sessionId: session.id });
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
        
        await addWebhookLog('info', `Processing line item`, {
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
            await addWebhookLog('warning', 'No product found in test session, checking metadata', { itemId: item.id });
            
            // Try to get data from session metadata
            if (session.metadata?.items) {
              try {
                const items = JSON.parse(session.metadata.items);
                if (items && items.length > 0) {
                  const firstItem = items[0];
                  trackId = firstItem.id || firstItem.track_id || '';
                  trackName = firstItem.title || 'Unknown Track';
                  licenseType = firstItem.licenseType || 'Standard';
                  
                  await addWebhookLog('info', 'Retrieved item data from session metadata', {
                    trackId,
                    trackName,
                    licenseType
                  });
                }
              } catch (parseError) {
                await addWebhookLog('error', 'Failed to parse items from session metadata', { 
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
            await addWebhookLog('error', 'No product found for line item', { itemId: item.id });
            continue;
          }
          
          productData = product;
          trackId = product.metadata?.track_id || product.metadata?.itemId || '';
          trackName = product.name || 'Unknown Track';
          licenseType = product.metadata?.licenseType || 'Standard';
        }
        
        await addWebhookLog('debug', 'Product data', {
          trackId,
          trackName,
          licenseType
        });
        
        // Validate trackId is a valid UUID
        if (!trackId || !isValidUUID(trackId)) {
          await addWebhookLog('error', 'Invalid track_id format', { trackId });
          // Generate a valid UUID as fallback
          trackId = generateUUID();
          await addWebhookLog('warning', 'Generated a fallback UUID for track_id', { newTrackId: trackId });
        }
        
        // Create order data with proper UUID handling
        const orderData = {
          id: generateUUID(),
          user_id: isValidUUID(supabaseUserId || '') ? supabaseUserId! : generateUUID(),
          track_id: isValidUUID(trackId) ? trackId : generateUUID(),
          track_name: trackName,
          license: licenseType,
          order_date: new Date().toISOString(),
          total_amount: (item.amount_total || 0) / 100,
          discount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0,
          license_file: null,
          customer_email: customerEmail || '',
          stripe_session_id: session.id,
          currency: session.currency?.toUpperCase() || 'USD',
          status: 'completed' as const
        };

        // Save order to Supabase
        try {
          await saveOrderToSupabase(orderData);
          
          // Create transaction record with proper UUID handling
          const transactionData = {
            order_id: orderData.id,
            user_id: orderData.user_id,
            amount: orderData.total_amount,
            currency: orderData.currency,
            transaction_type: 'payment' as const,
            status: 'completed' as const,
            stripe_transaction_id: session.payment_intent as string,
            metadata: {
              stripe_session_id: session.id,
              customer_email: customerEmail,
              track_name: trackName,
              license_type: licenseType,
              payment_method: session.payment_method_types?.[0] || 'unknown'
            }
          };

          const transaction = await transactionService.createTransaction(transactionData);
          if (!transaction) {
            console.error('Failed to create transaction record');
            await addWebhookLog('error', 'Failed to create transaction record', { 
              orderId: orderData.id,
              sessionId: session.id 
            });
          } else {
            console.log('Successfully created transaction record:', transaction.id);
            await addWebhookLog('success', 'Created transaction record', { 
              transactionId: transaction.id,
              orderId: orderData.id 
            });
          }
          
          // Generate license if this is a valid license type
          if (isValidLicenseType(orderData.license)) {
            try {
              console.log(`Generating license for order ${orderData.id}`);
              await addWebhookLog('info', `Generating license for order`, { 
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
                await addWebhookLog('error', 'Failed to upload license', { 
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
                  await addWebhookLog('error', 'Failed to update order with license file', { 
                    orderId: orderData.id,
                    error: updateError 
                  });
                } else {
                  console.log(`Generated and attached license file for order ${orderData.id}`);
                  await addWebhookLog('success', 'Generated and attached license file', { 
                    orderId: orderData.id,
                    fileName 
                  });
                }
              }
            } catch (licenseError) {
              console.error('Error generating license:', licenseError);
              await addWebhookLog('error', 'Error generating license', { 
                orderId: orderData.id, 
                error: licenseError 
              });
            }
          } else {
            console.log(`License type "${orderData.license}" is not valid for generating a license file`);
            await addWebhookLog('warning', 'Invalid license type for license generation', { 
              licenseType: orderData.license,
              orderId: orderData.id 
            });
          }
          
        } catch (error) {
          console.error('Error processing order and transaction:', error);
          await addWebhookLog('error', 'Error processing order and transaction', { 
            error,
            orderData,
            sessionId: session.id 
          });
          continue;
        }
      } catch (itemError) {
        console.error('Error processing line item:', itemError);
        await addWebhookLog('error', 'Error processing line item', { error: itemError });
      }
    }
    
    // Handle discount code usage if applicable
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        await discountService.incrementUsageCount(discountId);
        console.log(`Incremented usage count for discount code ${session.metadata?.discountCode}`);
        await addWebhookLog('success', 'Incremented discount code usage count', { 
          discountId,
          discountCode: session.metadata?.discountCode 
        });
      } catch (error) {
        console.error('Failed to increment discount code usage:', error);
        await addWebhookLog('error', 'Failed to increment discount code usage', { 
          discountId,
          error 
        });
      }
    }
    
    await addWebhookLog('success', 'Successfully processed checkout completion', { sessionId: session.id });
    console.log(`Successfully processed completed checkout for session ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout completed webhook:', error);
    await addWebhookLog('error', 'Error handling checkout completed webhook', { error });
    throw error;
  }
}

async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  try {
    console.log(`Processing async payment succeeded for session ${session.id}`);
    await addWebhookLog('info', `Processing async payment succeeded`, { sessionId: session.id });
    
    // Since this payment was successful, handle it the same way as checkout.session.completed
    await handleCheckoutCompleted(session);
    
    console.log(`Successfully processed async payment succeeded for session ${session.id}`);
    await addWebhookLog('success', `Successfully processed async payment succeeded`, { sessionId: session.id });
  } catch (error) {
    console.error('Error handling async payment succeeded webhook:', error);
    await addWebhookLog('error', 'Error handling async payment succeeded webhook', { error });
    throw error;
  }
}

async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  try {
    console.log(`Processing async payment failed for session ${session.id}`);
    await addWebhookLog('info', `Processing async payment failed`, { sessionId: session.id });
    
    const customerId = session.customer;
    if (!customerId) {
      console.error('No customer ID found in session:', session.id);
      await addWebhookLog('error', 'No customer ID found in session', { sessionId: session.id });
      return;
    }

    // Update order status
    await updateOrderStatus(session.id, 'failed', customerId.toString());
    
    // Create failed transaction record with proper UUID handling
    const transactionData = {
      order_id: null,
      user_id: isValidUUID(customerId.toString()) ? customerId.toString() : generateUUID(),
      amount: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'USD',
      transaction_type: 'payment' as const,
      status: 'failed' as const,
      stripe_transaction_id: session.payment_intent as string,
      metadata: {
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email,
        failure_reason: session.payment_status
      }
    };

    const transaction = await transactionService.createTransaction(transactionData);
    if (!transaction) {
      console.error('Failed to create failed transaction record');
      await addWebhookLog('error', 'Failed to create failed transaction record', { 
        sessionId: session.id 
      });
    } else {
      console.log('Successfully created failed transaction record:', transaction.id);
      await addWebhookLog('success', 'Created failed transaction record', { 
        transactionId: transaction.id 
      });
    }
    
    // Handle discount code usage if applicable
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        // Decrement usage count in our database since the payment failed
        await discountService.decrementUsageCount(discountId);
        
        console.log(`Successfully decremented usage count for discount code ${session.metadata?.discountCode}`);
        await addWebhookLog('success', 'Decremented discount code usage count', { 
          discountId,
          discountCode: session.metadata?.discountCode 
        });
      } catch (error) {
        console.error('Failed to decrement discount code usage:', error);
        await addWebhookLog('error', 'Failed to decrement discount code usage', { 
          discountId,
          error 
        });
      }
    }
    
    console.log(`Successfully processed async payment failed for session ${session.id}`);
    await addWebhookLog('success', `Successfully processed async payment failed`, { sessionId: session.id });
  } catch (error) {
    console.error('Error handling async payment failed webhook:', error);
    await addWebhookLog('error', 'Error handling async payment failed webhook', { error });
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    console.log(`Processing checkout expired for session ${session.id}`);
    await addWebhookLog('info', `Processing checkout expired`, { sessionId: session.id });
    
    // Get customer ID from the session
    const customerId = session.customer;
    if (!customerId) {
      console.error('No customer ID found in session:', session.id);
      await addWebhookLog('error', 'No customer ID found in session', { sessionId: session.id });
      return;
    }

    // Update order status
    await updateOrderStatus(session.id, 'failed', customerId.toString());
    await addWebhookLog('info', `Updated order status to failed`, { sessionId: session.id });
    
    // Get the discount code from metadata
    const discountId = session.metadata?.discountId;
    if (discountId) {
      try {
        // Decrement usage count in our database since the checkout failed
        await discountService.decrementUsageCount(discountId);
        
        console.log(`Successfully decremented usage count for discount code ${session.metadata?.discountCode}`);
        await addWebhookLog('success', 'Decremented discount code usage count', { 
          discountId,
          discountCode: session.metadata?.discountCode 
        });
      } catch (error) {
        console.error('Failed to decrement discount code usage:', error);
        await addWebhookLog('error', 'Failed to decrement discount code usage', { 
          discountId,
          error 
        });
      }
    }
    
    console.log(`Successfully processed checkout expired for session ${session.id}`);
    await addWebhookLog('success', `Successfully processed checkout expired`, { sessionId: session.id });
  } catch (error) {
    console.error('Error handling checkout expired webhook:', error);
    await addWebhookLog('error', 'Error handling checkout expired webhook', { error });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received webhook request');
    await addWebhookLog('info', 'Received webhook request');
    
    // Get the raw body as text for Stripe verification
    const rawBody = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature provided');
      await addWebhookLog('error', 'No Stripe signature provided');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    console.log('Validating Stripe webhook signature');
    await addWebhookLog('info', 'Validating Stripe webhook signature');
    
    let event;
    try {
      // Use the async version of constructEvent with the raw body as string
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      await addWebhookLog('error', `Webhook signature verification failed: ${err.message}`, {
        providedSignature: signature
      });
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event type: ${event.type}`);
    await addWebhookLog('info', `Processing webhook event type: ${event.type}`, { 
      eventId: event.id,
      eventType: event.type
    });

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
          // Return 200 status to avoid Stripe retries, but log the error
          return NextResponse.json({ 
            received: true, 
            warning: 'Webhook processed but encountered an error',
            error: error.message
          });
        }
        break;
      
      case 'checkout.session.async_payment_succeeded':
        try {
          await handleAsyncPaymentSucceeded(session);
        } catch (error: any) {
          console.error(`Error processing checkout.session.async_payment_succeeded webhook:`, error);
          await addWebhookLog('error', `Error processing async payment succeeded webhook: ${error.message}`, {
            sessionId: session.id,
            error: error.stack || error.toString()
          });
          return NextResponse.json({ 
            received: true, 
            warning: 'Webhook processed but encountered an error',
            error: error.message
          });
        }
        break;
      
      case 'checkout.session.async_payment_failed':
        try {
          await handleAsyncPaymentFailed(session);
        } catch (error: any) {
          console.error(`Error processing checkout.session.async_payment_failed webhook:`, error);
          await addWebhookLog('error', `Error processing async payment failed webhook: ${error.message}`, {
            sessionId: session.id,
            error: error.stack || error.toString()
          });
          return NextResponse.json({ 
            received: true, 
            warning: 'Webhook processed but encountered an error',
            error: error.message
          });
        }
        break;
      
      case 'checkout.session.expired':
        try {
          await handleCheckoutExpired(session);
        } catch (error: any) {
          console.error(`Error processing checkout.session.expired webhook:`, error);
          await addWebhookLog('error', `Error processing checkout.session.expired webhook: ${error.message}`, {
            sessionId: session.id,
            error: error.stack || error.toString() 
          });
          return NextResponse.json({ 
            received: true, 
            warning: 'Webhook processed but encountered an error',
            error: error.message
          });
        }
        break;
      
      default:
        console.log(`Ignoring unhandled event type: ${event.type}`);
        await addWebhookLog('warning', `Ignoring unhandled event type: ${event.type}`);
    }

    await addWebhookLog('success', 'Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook unhandled error:', error);
    console.error('Error stack:', error.stack || 'No stack trace available');
    await addWebhookLog('error', `Webhook unhandled error: ${error.message}`, {
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