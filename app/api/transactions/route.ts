import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    const userId = searchParams.get('userId')

    // Start building the query
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    // If admin parameter is true, check if user has admin role
    if (isAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } else if (userId) {
      // If userId is provided, only return transactions for that user
      // Also verify the requesting user has access to these transactions
      if (userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - Cannot access other user transactions' },
          { status: 403 }
        )
      }
      query = query.eq('user_id', userId)
    } else {
      // Default to showing only the user's own transactions
      query = query.eq('user_id', session.user.id)
    }

    // Execute the query
    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Unexpected error in transactions route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 