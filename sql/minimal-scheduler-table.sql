-- Minimal SQL to create the scheduler_state table
CREATE TABLE IF NOT EXISTS scheduler_state (
  id SERIAL PRIMARY KEY,
  json_state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial state if table is empty
INSERT INTO scheduler_state (json_state)
SELECT '{"active": false, "nextRun": null, "sources": [], "logs": []}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM scheduler_state);

-- Create a function to check if the table exists (for API testing)
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

-- Grant access to the function
GRANT EXECUTE ON FUNCTION check_scheduler_state_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION check_scheduler_state_exists() TO anon; 