require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPermissions() {
  try {
    console.log('Checking Supabase permissions...')
    
    // Attempt to authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
    })
    
    if (authError) {
      console.error('Authentication error:', authError)
      return
    }
    
    console.log('Authenticated as:', authData.user.email)
    console.log('User ID:', authData.user.id)
    
    // Try to insert a test transaction
    const { data: insertData, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: authData.user.id,
        amount: 10.00,
        currency: 'USD',
        status: 'pending',
        transaction_type: 'payment',
        payment_method: 'test',
        metadata: { test: true }
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
    } else {
      console.log('Insert successful:', insertData)
      
      // Clean up the test transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', insertData.id)
      
      if (deleteError) {
        console.error('Delete error:', deleteError)
      } else {
        console.log('Test transaction deleted')
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkPermissions() 