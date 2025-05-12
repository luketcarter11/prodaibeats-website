import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Maximum number of log entries to keep
const MAX_LOGS = 100;

// Path to the log file
const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'webhook-logs.json');

// Initialize log file if it doesn't exist
function initLogFile() {
  try {
    if (!fs.existsSync(path.dirname(LOG_FILE_PATH))) {
      fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
    }
    
    if (!fs.existsSync(LOG_FILE_PATH)) {
      fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing log file:', error);
  }
}

// Add a log entry
export function addWebhookLog(type: string, message: string, data?: any) {
  try {
    initLogFile();
    
    // Read current logs
    const logsString = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    const logs = JSON.parse(logsString || '[]');
    
    // Add new log entry
    logs.unshift({
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    });
    
    // Trim logs if too many
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }
    
    // Write back to file
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error adding webhook log:', error);
  }
}

// Get logs
function getWebhookLogs() {
  try {
    initLogFile();
    const logsString = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    return JSON.parse(logsString || '[]');
  } catch (error) {
    console.error('Error reading webhook logs:', error);
    return [];
  }
}

// Clear logs
function clearWebhookLogs() {
  try {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([], null, 2));
    return true;
  } catch (error) {
    console.error('Error clearing webhook logs:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Ensure we're in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }
  
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format');
  
  if (format === 'html') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Webhook Logs</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            h1 { margin-bottom: 20px; }
            .controls { display: flex; gap: 10px; margin-bottom: 20px; }
            button { padding: 10px; background: #5d3bed; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #4c2fe0; }
            button.danger { background: #e74c3c; }
            button.danger:hover { background: #c0392b; }
            .logs { background: #f5f5f5; border-radius: 8px; padding: 20px; max-height: 800px; overflow: auto; }
            .log-entry { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
            .log-entry:last-child { border-bottom: none; }
            .timestamp { color: #666; font-size: 0.9em; margin-bottom: 5px; }
            .message { font-weight: bold; margin-bottom: 10px; }
            .message.error { color: #e74c3c; }
            .message.info { color: #3498db; }
            .message.success { color: #2ecc71; }
            .message.warning { color: #f39c12; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto; margin: 0; }
            .empty-logs { text-align: center; color: #888; padding: 40px; }
          </style>
        </head>
        <body>
          <h1>Webhook Logs</h1>
          
          <div class="controls">
            <button id="refreshBtn">Refresh Logs</button>
            <button id="clearBtn" class="danger">Clear Logs</button>
            <button id="testWebhookBtn">Test Webhook</button>
          </div>
          
          <div class="logs" id="logsContainer">
            <div class="empty-logs">Loading logs...</div>
          </div>

          <script>
            function fetchLogs() {
              fetch('/api/webhook-logs')
                .then(response => response.json())
                .then(data => {
                  const container = document.getElementById('logsContainer');
                  
                  if (data.logs.length === 0) {
                    container.innerHTML = '<div class="empty-logs">No logs available</div>';
                    return;
                  }
                  
                  let html = '';
                  data.logs.forEach(log => {
                    html += \`
                      <div class="log-entry">
                        <div class="timestamp">\${new Date(log.timestamp).toLocaleString()}</div>
                        <div class="message \${log.type}">\${log.type.toUpperCase()}: \${log.message}</div>
                        \${log.data ? \`<pre>\${JSON.stringify(log.data, null, 2)}</pre>\` : ''}
                      </div>
                    \`;
                  });
                  
                  container.innerHTML = html;
                })
                .catch(error => {
                  console.error('Error fetching logs:', error);
                  document.getElementById('logsContainer').innerHTML = \`
                    <div class="empty-logs">Error loading logs: \${error.message}</div>
                  \`;
                });
            }
            
            document.getElementById('refreshBtn').addEventListener('click', fetchLogs);
            
            document.getElementById('clearBtn').addEventListener('click', () => {
              if (confirm('Are you sure you want to clear all logs?')) {
                fetch('/api/webhook-logs?clear=true', { method: 'POST' })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      fetchLogs();
                    } else {
                      alert('Failed to clear logs: ' + data.error);
                    }
                  })
                  .catch(error => {
                    alert('Error clearing logs: ' + error.message);
                  });
              }
            });
            
            document.getElementById('testWebhookBtn').addEventListener('click', () => {
              window.open('/api/test-webhook', '_blank');
            });
            
            // Initial load
            fetchLogs();
            
            // Auto-refresh every 5 seconds
            setInterval(fetchLogs, 5000);
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
    logs: getWebhookLogs()
  });
}

export async function POST(request: NextRequest) {
  // Ensure we're in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }
  
  const searchParams = request.nextUrl.searchParams;
  
  if (searchParams.get('clear') === 'true') {
    const success = clearWebhookLogs();
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to clear logs' },
        { status: 500 }
      );
    }
  }
  
  try {
    const body = await request.json();
    
    if (!body.type || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      );
    }
    
    addWebhookLog(body.type, body.message, body.data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 