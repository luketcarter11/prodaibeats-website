-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response TEXT
);

-- Add RLS policies
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert new messages
CREATE POLICY "Allow anonymous users to insert contact messages" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read their own messages
CREATE POLICY "Allow users to read their own messages" ON contact_messages
  FOR SELECT
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users WHERE email = contact_messages.email
  ));

-- Allow authenticated users to access all messages (for admin purposes)
-- This can be refined later with proper admin roles
CREATE POLICY "Allow authenticated users to manage all messages" ON contact_messages
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create function to create contact_messages table
CREATE OR REPLACE FUNCTION create_contact_messages_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_messages') THEN
    -- Create the table
    CREATE TABLE public.contact_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      responded_at TIMESTAMP WITH TIME ZONE,
      response TEXT
    );

    -- Add RLS policies
    ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

    -- Allow anonymous users to insert new messages
    CREATE POLICY "Allow anonymous users to insert contact messages" ON public.contact_messages
      FOR INSERT
      WITH CHECK (true);

    -- Allow authenticated users to read their own messages
    CREATE POLICY "Allow users to read their own messages" ON public.contact_messages
      FOR SELECT
      USING (auth.uid() IN (
        SELECT auth.uid() FROM auth.users WHERE email = contact_messages.email
      ));

    -- Allow authenticated users to access all messages (for admin purposes)
    -- This can be refined later with proper admin roles
    CREATE POLICY "Allow authenticated users to manage all messages" ON public.contact_messages
      FOR ALL
      USING (auth.role() = 'authenticated');
      
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$; 