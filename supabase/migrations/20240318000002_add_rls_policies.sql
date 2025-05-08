-- Enable RLS on the discount_codes table
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to do everything
CREATE POLICY "Admin users can do everything" ON discount_codes
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN (
            'everythingsimpleinc1@gmail.com' -- Add admin email addresses here
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'everythingsimpleinc1@gmail.com' -- Add admin email addresses here
        )
    );

-- Create policy for reading active discount codes
CREATE POLICY "Anyone can read active discount codes" ON discount_codes
    FOR SELECT
    TO public
    USING (active = true);

-- Grant necessary permissions to authenticated users
GRANT ALL ON discount_codes TO authenticated; 