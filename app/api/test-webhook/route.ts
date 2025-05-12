import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
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

// This function simulates how Stripe signs webhook events
function generateStripeSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed_payload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signed_payload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    // Ensure we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    // Parse request body or use default test data
    let testData;
    try {
      testData = await request.json();
    } catch (e) {
      // Use default test data
      const randomId = crypto.randomUUID();
      testData = {
        trackId: crypto.randomUUID(),
        trackName: 'Test Track from Webhook',
        userId: null, // Will try to use first user
        licenseType: 'Non-Exclusive',
        price: 19.99,
        customerEmail: 'test@example.com'
      };
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      );
    }

    // Create a simulated Stripe Checkout Session
    const sessionId = `cs_test_${Date.now()}`;
    const productId = `prod_${Date.now()}`;
    const priceId = `price_${Date.now()}`;
    const lineItemId = `li_${Date.now()}`;
    const customerId = `cus_${Date.now()}`;
    
    // Ensure we have a valid UUID for the user ID if provided
    let validUserId = null;
    if (testData.userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      validUserId = uuidRegex.test(testData.userId) ? testData.userId : null;
    }
    
    // If no valid user ID was provided, generate one
    // This ensures our test webhook creates valid orders
    if (!validUserId) {
      validUserId = crypto.randomUUID();
      console.log(`Generated valid UUID for user_id: ${validUserId}`);
    }
    
    // Ensure track ID is a valid UUID
    let validTrackId = testData.trackId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!validTrackId || !uuidRegex.test(validTrackId)) {
      validTrackId = crypto.randomUUID();
      console.log(`Generated valid UUID for track_id: ${validTrackId}`);
    }
    
    // Create a session with fully expanded line_items data
    // This avoids the need for retrieve calls in the webhook handler
    const event = {
      id: `evt_${Date.now()}`,
      object: 'event',
      api_version: '2025-04-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          after_expiration: null,
          allow_promotion_codes: null,
          amount_subtotal: Math.round(testData.price * 100),
          amount_total: Math.round(testData.price * 100),
          currency: 'usd',
          customer: customerId,
          customer_details: {
            email: testData.customerEmail,
            phone: null,
            tax_exempt: 'none',
            tax_ids: []
          },
          customer_email: testData.customerEmail,
          // Fully expand line_items to avoid the need for a separate retrieve call
          line_items: {
            object: "list",
            data: [
              {
                id: lineItemId,
                object: 'line_item',
                amount_subtotal: Math.round(testData.price * 100),
                amount_total: Math.round(testData.price * 100),
                currency: 'usd',
                description: `${testData.licenseType} License`,
                price: {
                  id: priceId,
                  object: 'price',
                  active: true,
                  product: {
                    id: productId,
                    object: 'product',
                    name: testData.trackName,
                    metadata: {
                      track_id: validTrackId,
                      licenseType: testData.licenseType,
                      originalPrice: testData.price.toString()
                    }
                  }
                },
                quantity: 1
              }
            ],
            has_more: false,
            total_count: 1,
            url: `/v1/checkout/sessions/${sessionId}/line_items`
          },
          metadata: {
            userId: validUserId,
            items: JSON.stringify([{
              id: validTrackId,
              track_id: validTrackId,
              title: testData.trackName,
              licenseType: testData.licenseType,
              price: testData.price
            }])
          },
          payment_intent: `pi_${Date.now()}`,
          payment_status: 'paid',
          status: 'complete',
          url: null,
          // Add fields to avoid additional Stripe API calls
          total_details: {
            amount_discount: 0,
            amount_shipping: 0,
            amount_tax: 0
          }
        }
      },
      type: 'checkout.session.completed'
    };

    // Convert event to string
    const payload = JSON.stringify(event);
    
    // Sign the event with the Stripe webhook secret
    const signature = generateStripeSignature(payload, webhookSecret);

    // Now, call our webhook endpoint with this simulated event
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': signature
        },
        body: payload
      });

      const responseBody = await response.text();
      
      return NextResponse.json({
        success: true,
        message: 'Simulated webhook sent to endpoint',
        webhookResponse: {
          status: response.status,
          statusText: response.statusText,
          body: responseBody
        },
        eventSent: event
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'Failed to send webhook to endpoint',
          details: error.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Display a simple form to test the webhook
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Stripe Webhook</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          form { display: flex; flex-direction: column; gap: 15px; }
          label { font-weight: bold; }
          input, select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
          button { padding: 10px; background: #5d3bed; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #4c2fe0; }
          .response { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px; white-space: pre-wrap; overflow: auto; max-height: 500px; }
        </style>
      </head>
      <body>
        <h1>Test Stripe Webhook</h1>
        <p>Use this form to simulate a Stripe checkout.session.completed webhook event.</p>
        
        <form id="testForm">
          <div>
            <label for="customerEmail">Customer Email:</label>
            <input type="email" id="customerEmail" name="customerEmail" value="test@example.com" required>
          </div>
          
          <div>
            <label for="userId">User ID (Optional):</label>
            <input type="text" id="userId" name="userId" placeholder="Leave empty to use random value">
            <small style="display: block; margin-top: 4px; color: #666;">
              Format: UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) -
              <a href="/api/test-webhook/users?format=html" target="_blank" style="color: #5d3bed;">View Available Users</a>
            </small>
          </div>
          
          <div>
            <label for="trackId">Track ID (UUID):</label>
            <input type="text" id="trackId" name="trackId" placeholder="Will generate random UUID if invalid" required>
            <small style="display: block; margin-top: 4px; color: #666;">Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</small>
          </div>
          
          <div>
            <label for="trackName">Track Name:</label>
            <input type="text" id="trackName" name="trackName" value="Test Track from Webhook" required>
          </div>
          
          <div>
            <label for="price">Price:</label>
            <input type="number" id="price" name="price" step="0.01" value="19.99" required>
          </div>
          
          <div>
            <label for="licenseType">License Type:</label>
            <select id="licenseType" name="licenseType" required>
              <option value="Non-Exclusive">Non-Exclusive</option>
              <option value="Non-Exclusive Plus">Non-Exclusive Plus</option>
              <option value="Exclusive">Exclusive</option>
              <option value="Exclusive Plus">Exclusive Plus</option>
              <option value="Exclusive Pro">Exclusive Pro</option>
            </select>
          </div>
          
          <button type="submit">Simulate Webhook Event</button>
        </form>
        
        <div id="response" class="response" style="display: none;"></div>
        
        <script>
          // UUID generation function
          function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0,
                  v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          }
          
          // Set a random UUID when the page loads
          document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('trackId').value = generateUUID();
          });
          
          document.getElementById('testForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const responseElement = document.getElementById('response');
            responseElement.style.display = 'block';
            responseElement.textContent = 'Processing...';
            
            const formData = {
              customerEmail: form.customerEmail.value,
              trackId: form.trackId.value,
              trackName: form.trackName.value,
              price: parseFloat(form.price.value),
              licenseType: form.licenseType.value,
              userId: form.userId.value || null
            };
            
            try {
              const response = await fetch('/api/test-webhook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
              });
              
              const data = await response.json();
              responseElement.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              responseElement.textContent = 'Error: ' + error.message;
            }
          });
        </script>
      </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 