import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
const twilioVerifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')!
const sendgridKey = Deno.env.get('SENDGRID_API_KEY')!
const sendgridFrom = Deno.env.get('SENDGRID_FROM_EMAIL')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contact, method } = await req.json()

    if (!contact || !method) {
      return new Response(
        JSON.stringify({ error: 'contact and method required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting: max 3 OTPs per hour per contact
    const { data: recent } = await supabase
      .from('otp_attempts')
      .select('created_at')
      .eq('contact', contact)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())

    if (recent && recent.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let success = false

    if (method === 'phone') {
      // Send via Twilio Verify
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifySid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: contact,
            Channel: 'sms',
          }),
        }
      )
      success = response.ok
    } else if (method === 'email') {
      // Send via SendGrid
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store code temporarily (in production, use Redis with TTL)
      await supabase.from('otp_codes').upsert({
        contact,
        code,
        expires_at: new Date(Date.now() + 900000).toISOString(), // 15 min
      })

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: contact }], dynamic_template_data: { code } }],
          from: { email: sendgridFrom, name: 'Zylo' },
          template_id: Deno.env.get('SENDGRID_OTP_TEMPLATE_ID'),
        }),
      })
      success = response.ok
    }

    // Log attempt
    await supabase.from('otp_attempts').insert({ contact, method, success })

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to send OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-otp error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})