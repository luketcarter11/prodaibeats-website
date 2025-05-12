import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { addWebhookLog } from '../webhook-logs/route';

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

    // Parse request body
    let debugData;
    try {
      debugData = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON input' },
        { status: 400 }
      );
    }

    // Log the attempt
    addWebhookLog('info', 'Debug webhook called', { debugData });

    // Check for connection to Supabase
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('orders').select('id').limit(1);
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to connect to Supabase',
          details: error
        }, { status: 500 });
      }
      
      addWebhookLog('success', 'Successfully connected to Supabase', { 
        testResult: 'Connected successfully',
        message: 'Supabase connection is working' 
      });
    } catch (error) {
      addWebhookLog('error', 'Failed to connect to Supabase', { error });
      return NextResponse.json({
        success: false,
        error: 'Supabase connection error',
        details: error
      }, { status: 500 });
    }

    // Test creating a record in Supabase
    try {
      const testOrderId = crypto.randomUUID();
      const supabase = getSupabaseAdmin();
      
      // Create a test record
      const testOrder = {
        id: testOrderId,
        user_id: debugData.userId || crypto.randomUUID(),
        track_id: debugData.trackId || crypto.randomUUID(),
        track_name: 'Debug Test Order',
        license: 'Standard',
        order_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_amount: 1.99,
        discount: 0,
        status: 'pending',
        stripe_session_id: `debug_test_${Date.now()}`,
        currency: 'USD',
        customer_email: debugData.email || 'test@example.com'
      };
      
      addWebhookLog('info', 'Attempting to create test order', testOrder);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(testOrder)
        .select();
      
      if (error) {
        addWebhookLog('error', 'Failed to create test order in Supabase', { 
          error,
          testOrder
        });
        
        return NextResponse.json({
          success: false,
          error: 'Failed to create test order',
          details: error,
          testOrder
        }, { status: 500 });
      }
      
      // Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', testOrderId);
      
      if (deleteError) {
        addWebhookLog('warning', 'Failed to clean up test order', { 
          error: deleteError,
          testOrderId 
        });
      }
      
      addWebhookLog('success', 'Successfully tested order creation and deletion', {
        message: 'Supabase order operations are working properly'
      });
      
      return NextResponse.json({
        success: true,
        message: 'Supabase connection and order creation tested successfully',
        testResults: {
          connection: 'Success',
          orderCreate: 'Success',
          orderDelete: deleteError ? 'Failed' : 'Success'
        }
      });
    } catch (error: any) {
      addWebhookLog('error', 'Unhandled error in debug webhook', { error });
      
      return NextResponse.json({
        success: false,
        error: 'Unhandled error during debug test',
        details: error.message || 'Unknown error'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Debug webhook error:', error);
    addWebhookLog('error', 'Debug webhook unhandled error', { error });
    
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
        <title>Debug Webhook Connection</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .box { background: #f4f4f8; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          h1 { margin-top: 0; }
          button { padding: 10px; background: #5d3bed; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #4c2fe0; }
          pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Debug Webhook Connection</h1>
          <p>Use this tool to test your Supabase connection and order creation functionality.</p>
          <p>This will attempt to:</p>
          <ol>
            <li>Connect to your Supabase database</li>
            <li>Create a test order record</li>
            <li>Delete the test record</li>
          </ol>
          <button id="debugBtn">Run Diagnostics</button>
        </div>
        
        <div id="result" style="display: none;" class="box">
          <h2>Diagnostic Results</h2>
          <pre id="resultContent"></pre>
        </div>
        
        <script>
          document.getElementById('debugBtn').addEventListener('click', async () => {
            const resultArea = document.getElementById('result');
            const resultContent = document.getElementById('resultContent');
            
            resultArea.style.display = 'block';
            resultContent.textContent = 'Running diagnostics...';
            
            try {
              const response = await fetch('/api/debug-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
              
              const data = await response.json();
              resultContent.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              resultContent.textContent = 'Error: ' + error.message;
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