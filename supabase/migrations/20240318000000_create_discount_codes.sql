-- Create enum for discount types
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type discount_type NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER CHECK (usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT valid_percentage CHECK (
    (type = 'percentage' AND amount <= 100) OR
    (type = 'fixed')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 