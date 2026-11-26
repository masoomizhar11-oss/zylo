import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break
      }
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        await handleTransferCreated(transfer)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook handler failed', { status: 500 })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata
  const purchaseId = metadata.purchase_id
  const itemId = metadata.item_id
  const buyerId = metadata.buyer_id

  if (!purchaseId || !itemId || !buyerId) return

  // Get item details for fee calculation
  const { data: item } = await supabase
    .from('catalog_items')
    .select('creator_id, price_cents, currency, royalty_bps')
    .eq('id', itemId)
    .single()

  if (!item) return

  const platformFeeBps = 500 // 5%
  const platformFeeCents = Math.round(paymentIntent.amount * platformFeeBps / 10000)
  const creatorEarningsCents = paymentIntent.amount - platformFeeCents

  // Update purchase
  await supabase
    .from('purchases')
    .update({
      status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      platform_fee_cents: platformFeeCents,
      creator_earnings_cents: creatorEarningsCents,
      delivered_at: new Date().toISOString(),
    })
    .eq('id', purchaseId)

  // Create notification for buyer
  await supabase.from('notifications').insert({
    profile_id: buyerId,
    type: 'purchase',
    title: 'Purchase confirmed',
    body: `Your purchase was successful! Access your content in the app.`,
    data: { purchase_id: purchaseId, item_id: itemId },
  })

  // Create notification for creator
  await supabase.from('notifications').insert({
    profile_id: item.creator_id,
    type: 'purchase',
    title: 'New sale!',
    body: `Someone bought your item for ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
    data: { purchase_id: purchaseId, item_id: itemId, earnings: creatorEarningsCents },
  })
}

async function handleAccountUpdated(account: Stripe.Account) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_account_id', account.id)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({ payouts_enabled: account.payouts_enabled })
      .eq('id', profile.id)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  // Track creator payouts
  console.log('Transfer created:', transfer.id, transfer.amount, transfer.currency)
}