import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addWebhookLog } from '../../../lib/webhookLogger';

// Set the runtime to edge for better performance
export const runtime = 'edge';

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

export async function GET(request: NextRequest) {
  try {
    // Ensure we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const tableName = searchParams.get('table') || 'orders';
    const format = searchParams.get('format');
    const count = parseInt(searchParams.get('count') || '5');
    
    try {
      // Verify connection to Supabase
      const supabase = getSupabaseAdmin();
      
      // Get sample records to understand the table structure
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(count);
      
      if (sampleError) {
        if (format === 'html') {
          return new Response(`
            <html>
              <head>
                <title>Database Error</title>
                <style>
                  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  .error { background: #ffebee; border-radius: 8px; padding: 20px; color: #c62828; }
                  h1 { margin-top: 0; }
                  pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto; }
                </style>
              </head>
              <body>
                <h1>Database Error</h1>
                <div class="error">
                  <h2>Failed to query table: ${tableName}</h2>
                  <pre>${JSON.stringify(sampleError, null, 2)}</pre>
                </div>
              </body>
            </html>
          `, { headers: { 'Content-Type': 'text/html' } });
        }
        
        return NextResponse.json({
          success: false,
          error: `Failed to query table: ${tableName}`,
          details: sampleError
        }, { status: 500 });
      }
      
      // Get the table structure from RPC if this is a Postgres database
      const { data: structureData, error: structureError } = await supabase.rpc(
        'debug_table_structure',
        { table_name: tableName }
      ).select();
      
      // Format the results
      if (format === 'html') {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Table Structure: ${tableName}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
                h1 { margin-bottom: 20px; }
                .container { display: flex; flex-direction: column; gap: 20px; }
                .box { background: #f4f4f8; border-radius: 8px; padding: 20px; }
                h2 { margin-top: 0; }
                table { width: 100%; border-collapse: collapse; }
                table, th, td { border: 1px solid #ddd; }
                th { background-color: #f0f0f4; text-align: left; padding: 8px; }
                td { padding: 8px; }
                .sample { margin-top: 20px; }
                pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto; }
                .controls { display: flex; gap: 10px; margin-bottom: 20px; }
                button, select { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; }
                button { background: #5d3bed; color: white; border: none; cursor: pointer; }
                button:hover { background: #4c2fe0; }
              </style>
            </head>
            <body>
              <h1>Table Structure: ${tableName}</h1>
              
              <div class="controls">
                <select id="tableSelector">
                  <option value="orders" ${tableName === 'orders' ? 'selected' : ''}>orders</option>
                  <option value="users" ${tableName === 'users' ? 'selected' : ''}>users</option>
                  <option value="discount_codes" ${tableName === 'discount_codes' ? 'selected' : ''}>discount_codes</option>
                  <option value="tracks" ${tableName === 'tracks' ? 'selected' : ''}>tracks</option>
                </select>
                <button id="viewBtn">View Table</button>
                <button id="refreshBtn">Refresh</button>
                <a href="/api/debug-webhook"><button>Run Connection Test</button></a>
              </div>
              
              <div class="container">
                ${structureError ? `
                  <div class="box">
                    <h2>Table Structure</h2>
                    <p>Unable to retrieve detailed table structure. This may be due to missing database functions or permissions.</p>
                  </div>
                ` : `
                  <div class="box">
                    <h2>Table Structure</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Type</th>
                          <th>Nullable</th>
                          <th>Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${structureData?.map(col => `
                          <tr>
                            <td>${col.column_name}</td>
                            <td>${col.data_type}</td>
                            <td>${col.is_nullable === 'YES' ? 'YES' : 'NO'}</td>
                            <td>${col.column_default || ''}</td>
                          </tr>
                        `).join('') || '<tr><td colspan="4">No structure data available</td></tr>'}
                      </tbody>
                    </table>
                  </div>
                `}
                
                <div class="box">
                  <h2>Sample Data (${sampleData?.length || 0} records)</h2>
                  ${sampleData?.length ? `
                    <pre>${JSON.stringify(sampleData, null, 2)}</pre>
                  ` : `
                    <p>No data found in table.</p>
                  `}
                </div>
              </div>
              
              <script>
                document.getElementById('tableSelector').addEventListener('change', function() {
                  const table = this.value;
                  document.getElementById('viewBtn').onclick = function() {
                    window.location.href = \`/api/debug-table?table=\${table}&format=html\`;
                  };
                });
                
                document.getElementById('refreshBtn').addEventListener('click', function() {
                  window.location.reload();
                });
                
                // Auto-initialize view button
                document.getElementById('viewBtn').onclick = function() {
                  const table = document.getElementById('tableSelector').value;
                  window.location.href = \`/api/debug-table?table=\${table}&format=html\`;
                };
              </script>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
    
      return NextResponse.json({
        success: true,
        table: tableName,
        structure: structureData || 'Not available',
        sampleData
      });
    } catch (error: any) {
      if (format === 'html') {
        return new Response(`
          <html>
            <head>
              <title>Error</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .error { background: #ffebee; border-radius: 8px; padding: 20px; color: #c62828; }
                h1 { margin-top: 0; }
                pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto; }
              </style>
            </head>
            <body>
              <h1>Error</h1>
              <div class="error">
                <h2>${error.message || 'Unknown error'}</h2>
                <pre>${error.stack || ''}</pre>
              </div>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message || 'An unknown error occurred'
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 