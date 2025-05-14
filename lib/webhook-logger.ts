/**
 * Log webhook events with metadata
 */
export const addWebhookLog = async (
  level: 'info' | 'error' | 'success',
  message: string,
  metadata?: Record<string, any>
) => {
  console.log(`[Webhook ${level.toUpperCase()}] ${message}`, metadata || '');
  
  // TODO: Add proper logging to a database or logging service
  // For now, we just console.log the events
}; 