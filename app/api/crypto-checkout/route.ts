import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type CryptoType = 'SOL' | 'PROD';

// Hardcoded exchange rates as fallback (same as in crypto-payment page)
const FALLBACK_PRICES: Record<CryptoType, number> = {
  SOL: 171.37,
  PROD: 0.00003
};

// Convert USD to crypto amount
const convertToCrypto = (usdAmount: number, cryptoType: CryptoType, prices = FALLBACK_PRICES) => {
  if (!prices[cryptoType]) return null;
  return usdAmount / prices[cryptoType];
};

export async function POST(request: Request) {
  try {
    // Get the request cookies
    const cookieStore = cookies();
    
    // Create a Supabase client with cookie handling
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore,
    });

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { 
          error: 'Authentication required',
          details: 'Please sign in to continue',
          action: 'Please sign in again'
        },
        { status: 401 }
      );
    }

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { cart, total, cryptoType = 'SOL' as CryptoType } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request - Cart is empty or invalid' },
        { status: 400 }
      );
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid request - Invalid total amount' },
        { status: 400 }
      );
    }

    // Calculate crypto amount
    const cryptoAmount = convertToCrypto(total, cryptoType);
    if (!cryptoAmount) {
      return NextResponse.json(
        { error: 'Failed to calculate crypto amount' },
        { status: 400 }
      );
    }

    console.log('Creating crypto transaction with params:', {
      user_id: session.user.id,
      usd_amount: total,
      crypto_type: cryptoType,
      crypto_amount: cryptoAmount,
      customer_email: session.user.email,
      license_type: cart[0]?.licenseType
    });

    // Store the transaction in the transactions table using RPC
    const { data: transaction, error: rpcError } = await supabase.rpc(
      'create_crypto_transaction',
      {
        p_user_id: session.user.id,
        p_usd_amount: total,
        p_crypto_type: cryptoType,
        p_crypto_amount: cryptoAmount,
        p_metadata: {
          items: cart,
          payment_method: 'crypto',
          exchange_rate: FALLBACK_PRICES[cryptoType as CryptoType],
          calculated_at: new Date().toISOString()
        },
        p_customer_email: session.user.email,
        p_license_type: cart[0]?.licenseType || null
      }
    );

    if (rpcError) {
      console.error('RPC error:', rpcError);
      
      // Try direct insert as fallback
      console.log('Attempting direct insert as fallback...');
      const { data: directData, error: directError } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          amount: cryptoAmount,
          currency: cryptoType,
          status: 'awaiting_payment',
          transaction_type: 'crypto_purchase',
          payment_method: `crypto_${cryptoType.toLowerCase()}`,
          customer_email: session.user.email,
          license_type: cart[0]?.licenseType || null,
          metadata: {
            items: cart,
            payment_method: 'crypto',
            original_usd_amount: total,
            crypto: {
              type: cryptoType,
              expected_amount: cryptoAmount,
              selected_at: new Date().toISOString()
            },
            exchange_rate: FALLBACK_PRICES[cryptoType as CryptoType],
            calculated_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (directError) {
        console.error('Direct insert error:', directError);
        return NextResponse.json(
          { 
            error: 'Failed to create transaction',
            details: 'Database error occurred',
            action: 'Please try again or contact support'
          },
          { status: 500 }
        );
      }

      // Use the direct insert result
      return NextResponse.json({
        paymentUrl: `/crypto-payment?transaction=${directData.id}`,
        sessionId: directData.id,
        cryptoAmount,
        cryptoType
      });
    }

    // Use the RPC result
    return NextResponse.json({
      paymentUrl: `/crypto-payment?transaction=${transaction[0].id}`,
      sessionId: transaction[0].id,
      cryptoAmount,
      cryptoType
    });
  } catch (error: any) {
    console.error('Crypto checkout error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        action: 'Please try again or contact support'
      },
      { status: 500 }
    );
  }
} 