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
export function getWebhookLogs() {
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
export function clearWebhookLogs() {
  try {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([], null, 2));
    return true;
  } catch (error) {
    console.error('Error clearing webhook logs:', error);
    return false;
  }
} 