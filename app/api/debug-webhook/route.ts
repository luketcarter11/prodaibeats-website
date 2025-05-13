import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addWebhookLog } from '../../../lib/webhookLogger';

// Set the runtime to edge for better performance
export const runtime = 'edge';

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
    const body = await request.json();
    const { type, message, data } = body;
    
    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }
    
    // Add log entry
    await addWebhookLog(type, message, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in debug webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process debug webhook' },
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