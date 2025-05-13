-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read webhook logs
CREATE POLICY "Allow authenticated users to read webhook logs"
  ON public.webhook_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage webhook logs
CREATE POLICY "Allow service role to manage webhook logs"
  ON public.webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index on timestamp for efficient ordering
CREATE INDEX webhook_logs_timestamp_idx ON public.webhook_logs (timestamp DESC);

-- Add function to clean up old logs
CREATE OR REPLACE FUNCTION clean_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.webhook_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

-- Create a scheduled job to clean up old logs daily
SELECT cron.schedule(
  'clean-webhook-logs',
  '0 0 * * *',  -- Run at midnight every day
  'SELECT clean_old_webhook_logs();'
); 