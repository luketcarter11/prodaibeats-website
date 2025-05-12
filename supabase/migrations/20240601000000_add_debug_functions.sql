-- Create a function to retrieve table structure information for debugging purposes
-- This function is used by the debug-table endpoint to display table structure
CREATE OR REPLACE FUNCTION debug_table_structure(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public'
    AND c.table_name = table_name
  ORDER BY 
    c.ordinal_position;
END;
$$;

-- Set permissions for the debug function (should only be usable by authenticated users)
GRANT EXECUTE ON FUNCTION debug_table_structure TO authenticated;
GRANT EXECUTE ON FUNCTION debug_table_structure TO service_role; 