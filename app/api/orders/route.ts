import { NextResponse } from 'next/server';
import { Order } from '../../../lib/getOrders';
import { createClient } from '@supabase/supabase-js';
import { supabase, getServiceRoleKey } from '../../../lib/supabaseClient';

// Helper function to create a new admin client if needed
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getServiceRoleKey();
  
  // If we don't have the required credentials, return regular supabase client
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Missing Supabase admin credentials - using regular client with limited permissions');
    return supabase;
  }
  
  // Create and return admin client
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
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('admin') === 'true';
    
    // Get appropriate client
    const client = getSupabaseAdmin();

    // For admin, fetch all orders if admin flag is provided
    if (isAdmin) {
      const { data: orders, error } = await client
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error fetching all orders:', error);
        return NextResponse.json(
          { error: 'Failed to fetch orders' },
          { status: 500 }
        );
      }

      return NextResponse.json(orders || []);
    }

    // For regular users, fetch only their orders
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: orders, error } = await client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('Error in orders API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 