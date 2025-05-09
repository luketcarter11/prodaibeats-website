import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to create a new admin client 
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';
    const userId = searchParams.get('userId');
    
    // Get admin client with service role
    const supabase = getSupabaseAdmin();
    
    // Different actions for debugging
    switch (action) {
      case 'check': {
        // Count orders
        const { data: countData, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact' });
          
        if (countError) {
          return NextResponse.json({ 
            error: `Error counting orders: ${countError.message}`,
            details: countError
          }, { status: 500 });
        }
        
        // Get table info
        let tableInfo = null;
        let tableError = null;
        try {
          const { data, error } = await supabase
            .rpc('get_table_info', { table_name: 'orders' });
          tableInfo = data;
          tableError = error;
        } catch (err) {
          tableError = { message: 'RPC not available' };
        }
        
        return NextResponse.json({
          ordersCount: countData?.length || 0,
          orders: countData || [],
          tableInfo: tableInfo || null,
          tableError: tableError || null,
          envCheck: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            nodeEnv: process.env.NODE_ENV
          }
        });
      }
      
      case 'test-insert': {
        // Create a test order
        const testOrder = {
          id: `test_order_${Date.now()}`,
          user_id: userId || 'test_user',
          track_id: 'test_track_001',
          track_name: 'Test Track',
          license: 'Standard',
          total_amount: 29.99,
          order_date: new Date().toISOString(),
          status: 'completed' as const,
          stripe_session_id: `test_session_${Date.now()}`,
          customer_email: 'test@example.com',
          currency: 'USD'
        };
        
        const { data, error } = await supabase
          .from('orders')
          .insert(testOrder)
          .select();
          
        if (error) {
          return NextResponse.json({ 
            success: false,
            error: `Failed to insert test order: ${error.message}`,
            details: error
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: 'Test order created successfully',
          order: testOrder,
          response: data
        });
      }
      
      case 'check-user': {
        if (!userId) {
          return NextResponse.json({ 
            error: 'userId parameter is required for check-user action'
          }, { status: 400 });
        }
        
        // Get user orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId);
          
        if (ordersError) {
          return NextResponse.json({ 
            error: `Error fetching user orders: ${ordersError.message}`,
            details: ordersError
          }, { status: 500 });
        }
        
        // Try to get user from auth
        let authUser = null;
        let authError = null;
        
        try {
          const { data, error } = await supabase.auth.admin.getUserById(userId);
          authUser = data.user;
          authError = error;
        } catch (e) {
          authError = e;
        }
        
        return NextResponse.json({
          userId,
          ordersFound: orders?.length || 0,
          orders: orders || [],
          authUser,
          authError: authError ? (authError as any).message : null
        });
      }
      
      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in debug-orders API route:', error);
    return NextResponse.json({
      error: `An unexpected error occurred: ${(error as any).message}`,
      details: error
    }, { status: 500 });
  }
} 