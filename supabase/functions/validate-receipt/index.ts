import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET')
const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

serve(async (req: Request) => {
  try {
    const { user_id, receipt_data, product_id } = await req.json()

    if (!user_id || !receipt_data || !product_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First try production environment
    let response = await fetch(APPLE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt_data,
        'password': APPLE_SHARED_SECRET,
        'exclude-old-transactions': true
      })
    })

    let result = await response.json()

    // If status 21007, try sandbox environment
    if (result.status === 21007) {
      response = await fetch(APPLE_SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receipt_data,
          'password': APPLE_SHARED_SECRET,
          'exclude-old-transactions': true
        })
      })
      result = await response.json()
    }

    // Check for valid status
    if (result.status !== 0) {
      console.error('Invalid receipt status:', result.status)
      return new Response(
        JSON.stringify({ error: 'Invalid receipt', status: result.status }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get latest receipt info
    const latestReceipt = result.latest_receipt_info?.[result.latest_receipt_info.length - 1]
    if (!latestReceipt) {
      console.error('No receipt info found')
      return new Response(
        JSON.stringify({ error: 'No receipt info found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify product ID matches
    if (latestReceipt.product_id !== product_id) {
      console.error('Product ID mismatch:', { expected: product_id, received: latestReceipt.product_id })
      return new Response(
        JSON.stringify({ error: 'Product ID mismatch' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if subscription is active
    const now = new Date().getTime()
    const expiresDate = new Date(latestReceipt.expires_date_ms).getTime()
    
    if (expiresDate < now) {
      console.error('Subscription expired:', { expiresDate, now })
      return new Response(
        JSON.stringify({ error: 'Subscription expired' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update subscription in database
    const { data, error } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id,
        product_id,
        original_transaction_id: latestReceipt.original_transaction_id,
        latest_receipt: receipt_data,
        status: 'active',
        purchase_date: latestReceipt.purchase_date,
        end_date: latestReceipt.expires_date,
        platform: 'ios'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        subscription: {
          product_id,
          expires_date: latestReceipt.expires_date,
          original_transaction_id: latestReceipt.original_transaction_id
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 