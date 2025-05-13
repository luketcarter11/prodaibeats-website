import { createClient } from '@supabase/supabase-js';

// Maximum number of log entries to keep
const MAX_LOGS = 100;

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

// Add a log entry
export async function addWebhookLog(type: string, message: string, data?: any) {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Only log to console in production
      console.log(`[${type.toUpperCase()}] ${message}`, data || '');
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Add new log entry
    const logEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data: data ? JSON.stringify(data) : null
    };
    
    // Insert log entry
    const { error } = await supabase
      .from('webhook_logs')
      .insert(logEntry);
      
    if (error) {
      console.error('Error adding webhook log:', error);
    }
    
    // Trim old logs
    const { data: oldLogs } = await supabase
      .from('webhook_logs')
      .select('id')
      .order('timestamp', { ascending: false })
      .range(MAX_LOGS, MAX_LOGS + 100);
      
    if (oldLogs && oldLogs.length > 0) {
      const oldLogIds = oldLogs.map(log => log.id);
      await supabase
        .from('webhook_logs')
        .delete()
        .in('id', oldLogIds);
    }
  } catch (error) {
    console.error('Error adding webhook log:', error);
  }
}

// Get logs
export async function getWebhookLogs() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(MAX_LOGS);
      
    if (error) {
      console.error('Error reading webhook logs:', error);
      return [];
    }
    
    return data.map(log => ({
      ...log,
      data: log.data ? JSON.parse(log.data) : null
    }));
  } catch (error) {
    console.error('Error reading webhook logs:', error);
    return [];
  }
}

// Clear logs
export async function clearWebhookLogs() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return true;
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('webhook_logs')
      .delete()
      .neq('id', ''); // Delete all records
      
    if (error) {
      console.error('Error clearing webhook logs:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing webhook logs:', error);
    return false;
  }
} 