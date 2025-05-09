-- Create a simple function to check if service role is working
CREATE OR REPLACE FUNCTION create_service_role_check_function()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function simply returns true to confirm it ran successfully
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a verification function that only service role can call
CREATE OR REPLACE FUNCTION verify_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- This will only succeed if called with service role
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Restrict access to the verification function
REVOKE ALL ON FUNCTION verify_service_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_service_role() TO service_role; 