CREATE OR REPLACE FUNCTION increment_discount_code_usage(code_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET used_count = used_count + 1
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_discount_code_usage(code_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET used_count = GREATEST(0, used_count - 1)
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql; 