import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize Supabase with runtime check
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, total } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get the discount code from the database
    const { data: discount, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single();

    if (error || !discount) {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'Invalid discount code'
        },
        { status: 200 }
      );
    }

    // Check if code has expired
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'This discount code has expired'
        },
        { status: 200 }
      );
    }

    // Check usage limit
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'This discount code has reached its usage limit'
        },
        { status: 200 }
      );
    }

    // Calculate final amount after discount
    let finalAmount = total;
    if (discount.type === 'percentage') {
      finalAmount = total * (1 - discount.amount / 100);
    } else {
      finalAmount = Math.max(0, total - discount.amount);
    }

    // Check minimum amount requirement ($0.50)
    if (finalAmount < 0.50) {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'The total amount after discount must be at least $0.50'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      isValid: true,
      code: {
        code: discount.code,
        type: discount.type,
        amount: discount.amount,
        id: discount.id
      }
    });

  } catch (error: any) {
    console.error('Error validating discount:', error);
    return NextResponse.json(
      { 
        isValid: false,
        error: 'Failed to validate discount code'
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