-- Enable Row Level Security on the transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own transactions
CREATE POLICY "Users can view their own transactions" 
ON transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to insert their own transactions
CREATE POLICY "Users can insert their own transactions" 
ON transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own transactions
CREATE POLICY "Users can update their own transactions" 
ON transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated; 