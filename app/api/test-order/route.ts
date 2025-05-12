import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
      // Use default test data if no data is provided
      testData = {
        userId: null, // Can be null to use first user
        trackId: crypto.randomUUID(), // Generate a valid UUID for track_id
        trackName: 'Test Track',
        price: 19.99,
        licenseType: 'Non-Exclusive',
      };
    }

    // Ensure trackId is a valid UUID
    if (testData.trackId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testData.trackId)) {
      // If trackId is not a valid UUID, generate one
      testData.trackId = crypto.randomUUID();
      console.log(`Generated new UUID for track_id: ${testData.trackId}`);
    }

    // If no userId is provided, find the first user in the system
    let userId = testData.userId;
    if (!userId) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        
        if (error || !users || users.users.length === 0) {
          return NextResponse.json(
            { error: 'No users found in the system' },
            { status: 400 }
          );
        }
        
        userId = users.users[0].id;
        console.log(`Using first user from system: ${userId}`);
      } catch (error: any) {
        console.error('Error finding users:', error);
        return NextResponse.json(
          { error: 'Failed to find a user to create test order for' },
          { status: 500 }
        );
      }
    }

    // Create test order directly in Supabase
    const order = {
      id: crypto.randomUUID(),
      user_id: userId,
      track_id: testData.trackId,
      track_name: testData.trackName,
      license: testData.licenseType,
      total_amount: testData.price,
      discount: 0, // Set a default value for discount
      order_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'completed',
      stripe_session_id: `test_session_${Date.now()}`,
      currency: 'USD'
    };

    console.log('Creating test order in Supabase:', order);

    // Insert the order directly into Supabase
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(order)
      .select();

    if (error) {
      console.error('Error creating test order:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create test order',
          details: error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      order: data
    });

  } catch (error: any) {
    console.error('Debug webhook error:', error);
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
        <title>Test Order Creation</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          form { display: flex; flex-direction: column; gap: 15px; }
          label { font-weight: bold; }
          input, select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
          button { padding: 10px; background: #5d3bed; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #4c2fe0; }
          .response { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Test Order Creation</h1>
        <p>Use this form to create a test order directly in Supabase for debugging purposes.</p>
        
        <form id="testForm">
          <div>
            <label for="userId">User ID (optional):</label>
            <input type="text" id="userId" name="userId" placeholder="Leave empty to use first user">
          </div>
          
          <div>
            <label for="trackId">Track ID (Must be UUID):</label>
            <input type="text" id="trackId" name="trackId" placeholder="Will generate random UUID if invalid" required>
            <small style="display: block; margin-top: 4px; color: #666;">Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</small>
          </div>
          
          <div>
            <label for="trackName">Track Name:</label>
            <input type="text" id="trackName" name="trackName" value="Test Track" required>
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
          
          <button type="submit">Create Test Order</button>
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
              userId: form.userId.value || null,
              trackId: form.trackId.value,
              trackName: form.trackName.value,
              price: parseFloat(form.price.value),
              licenseType: form.licenseType.value,
            };
            
            try {
              const response = await fetch('/api/test-order', {
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