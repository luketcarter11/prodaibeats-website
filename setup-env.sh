#!/bin/bash

# Create .env.local file with Supabase placeholders
cat > .env.local << 'EOF'
# Supabase credentials
# Replace these values with your actual Supabase project credentials

# Your Supabase project URL (e.g., https://yourproject.supabase.co)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co

# Your Supabase anonymous/public key (found in project settings -> API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EOF

echo "Created .env.local file with Supabase placeholder values."
echo "Please edit the file and replace the placeholders with your actual Supabase credentials."
echo "Then restart your development server with: npm run dev" 