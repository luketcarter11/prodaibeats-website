-- Create the scheduler_state table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduler_state (
  id SERIAL PRIMARY KEY,
  json_state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS scheduler_state_updated_at_idx ON scheduler_state(updated_at);

-- Create RLS policies
ALTER TABLE scheduler_state ENABLE ROW LEVEL SECURITY;

-- Allow all operations (SELECT, INSERT, UPDATE, DELETE) for everyone
-- The policy is enabled but effectively grants access to everyone
DROP POLICY IF EXISTS scheduler_state_select_policy ON scheduler_state;
DROP POLICY IF EXISTS scheduler_state_admin_policy ON scheduler_state;

-- Create a single policy for all operations
CREATE POLICY scheduler_state_public_policy ON scheduler_state
  FOR ALL USING (true) WITH CHECK (true);

-- Insert initial state if table is empty
INSERT INTO scheduler_state (json_state)
SELECT '{"active": false, "nextRun": null, "sources": [], "logs": []}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM scheduler_state);

-- Create function to check if scheduler_state table exists
-- This can be called from the client to verify DB setup
CREATE OR REPLACE FUNCTION check_scheduler_state_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'scheduler_state'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function for all users including public/anonymous
DROP POLICY IF EXISTS scheduler_state_public_policy ON scheduler_state;
CREATE POLICY scheduler_state_public_policy ON scheduler_state
  FOR ALL USING (true) WITH CHECK (true);
GRANT EXECUTE ON FUNCTION check_scheduler_state_exists() TO PUBLIC;

-- Create a function to initialize a scheduler source
CREATE OR REPLACE FUNCTION initialize_scheduler_source(
  source_url TEXT,
  source_type TEXT
) RETURNS JSONB AS $$
DECLARE
  latest_state JSONB;
  new_source JSONB;
  source_id TEXT;
  updated_state JSONB;
BEGIN
  -- Generate a new UUID for the source
  source_id := gen_random_uuid()::TEXT;
  
  -- Create the new source object
  new_source := jsonb_build_object(
    'id', source_id,
    'source', source_url,
    'type', source_type,
    'lastChecked', NULL,
    'active', true
  );
  
  -- Get the latest state
  SELECT json_state INTO latest_state
  FROM scheduler_state
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If no state exists, create a default one
  IF latest_state IS NULL THEN
    latest_state := '{"active": false, "nextRun": null, "sources": [], "logs": []}'::JSONB;
  END IF;
  
  -- Add the new source to the sources array
  updated_state := jsonb_set(
    latest_state,
    '{sources}',
    (latest_state->'sources') || new_source
  );
  
  -- Add a log entry
  updated_state := jsonb_set(
    updated_state,
    '{logs}',
    jsonb_build_array(
      jsonb_build_object(
        'timestamp', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'message', 'Added new ' || source_type || ': ' || source_url,
        'type', 'success'
      )
    ) || (updated_state->'logs')
  );
  
  -- Save the updated state
  INSERT INTO scheduler_state (json_state, updated_at)
  VALUES (updated_state, now());
  
  -- Return the new source
  RETURN new_source;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function for all users including public/anonymous
GRANT EXECUTE ON FUNCTION initialize_scheduler_source(TEXT, TEXT) TO PUBLIC; 