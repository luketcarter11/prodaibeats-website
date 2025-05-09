import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DiscountCode } from '@/types/discount';
import { Database } from '@/types/supabase';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize Supabase with improved error handling
const getSupabase = () => {
  // Get environment variables with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Check for valid values
  if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
    console.error('Supabase URL is not defined or is a placeholder');
    throw new Error('Supabase URL configuration issue');
  }
  
  if (!supabaseKey || supabaseKey === 'placeholder-key') {
    console.error('Supabase key is not defined or is a placeholder');
    throw new Error('Supabase key configuration issue');
  }

  // Create client with public anon key - requires proper RLS policies
  try {
    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    throw new Error('Failed to initialize Supabase client');
  }
};

export async function POST(req: NextRequest) {
  try {
    // Log environment variable presence (not values for security)
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    console.log(`Environment check: URL=${hasUrl}, AnonKey=${hasAnonKey}`);
    
    // Extract request data
    const { code, total } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { isValid: false, error: 'Invalid discount code format' },
        { status: 400 }
      );
    }

    // Trim but don't convert case - we use 'ilike' for case insensitive matching
    const trimmedCode = code.trim();
    console.log(`Looking for discount code: "${trimmedCode}"`);

    // Initialize Supabase client
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error: any) {
      console.error('Supabase initialization error:', error);
      return NextResponse.json(
        { isValid: false, error: `Database connection error: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Get discount code from database - case insensitive match
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .filter('code', 'ilike', trimmedCode)
      .eq('active', true)
      .limit(1);

    // Log query outcome
    console.log(`Query found ${data?.length || 0} discount codes`);
    if (data && data.length > 0) {
      console.log(`Found discount code: ${JSON.stringify(data[0], null, 2)}`);
    }
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { isValid: false, error: 'Error retrieving discount code' },
        { status: 200 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { isValid: false, error: 'Invalid discount code' },
        { status: 200 }
      );
    }

    // Use the first result
    const discountCode = data[0];

    // Check if discount code is expired
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json(
        { isValid: false, error: 'Discount code has expired' },
        { status: 200 }
      );
    }

    // Check if discount code has reached usage limit
    if (discountCode.usage_limit && discountCode.used_count >= discountCode.usage_limit) {
      return NextResponse.json(
        { isValid: false, error: 'Discount code has reached maximum usage' },
        { status: 200 }
      );
    }

    // Calculate the final amount after discount
    let finalAmount = total;
    let discountAmount = 0;
    
    if (discountCode.type === 'percentage') {
      discountAmount = total * (discountCode.amount / 100);
      finalAmount = total - discountAmount;
    } else {
      discountAmount = discountCode.amount;
      finalAmount = Math.max(0, total - discountAmount);
    }

    // Ensure minimum amount of $0.50 for Stripe
    if (finalAmount < 0.50) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: 'Total amount after discount must be at least $0.50' 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      isValid: true,
      code: {
        id: discountCode.id,
        code: discountCode.code,
        type: discountCode.type,
        amount: discountCode.amount
      },
      discountAmount: discountAmount,
      finalAmount: finalAmount
    });
  } catch (error: any) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { 
        isValid: false, 
        error: `Failed to validate discount code: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return methodNotAllowed();
}

export function PUT() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

// Helper function for method not allowed response
function methodNotAllowed() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST'
      }
    }
  );
} 