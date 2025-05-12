import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    // Ensure we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    // Get users from Supabase
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    // Format user data for response
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }));
    
    // Check for HTML format parameter
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');
    
    if (format === 'html') {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Supabase Users</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { margin-bottom: 20px; }
              .users { background: #f5f5f5; border-radius: 8px; padding: 20px; }
              .user { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
              .user:last-child { border-bottom: none; }
              .user-id { font-family: monospace; font-size: 0.9em; color: #666; }
              .user-email { font-weight: bold; margin: 5px 0; }
              .empty-users { text-align: center; color: #888; padding: 40px; }
              .copy-button { background: #5d3bed; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; margin-left: 10px; }
              .copy-button:hover { background: #4c2fe0; }
              .controls { display: flex; gap: 10px; margin-bottom: 20px; }
              .back-button { padding: 10px; background: #5d3bed; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
              .back-button:hover { background: #4c2fe0; }
            </style>
          </head>
          <body>
            <h1>Supabase Users</h1>
            
            <div class="controls">
              <a href="/api/test-webhook" class="back-button">Back to Test Webhook</a>
            </div>
            
            <div class="users" id="usersList">
              ${users.length === 0 
                ? '<div class="empty-users">No users found</div>' 
                : users.map(user => `
                  <div class="user">
                    <div class="user-id">
                      ID: ${user.id} 
                      <button class="copy-button" onclick="copyToClipboard('${user.id}')">Copy ID</button>
                    </div>
                    <div class="user-email">${user.email}</div>
                    <div>Created: ${new Date(user.created_at).toLocaleString()}</div>
                  </div>
                `).join('')
              }
            </div>
            
            <script>
              function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                  alert('Copied user ID to clipboard!');
                }).catch(err => {
                  console.error('Failed to copy text: ', err);
                });
              }
            </script>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 