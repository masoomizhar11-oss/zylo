import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
const twilioVerifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contact, code, method, device_id, attestation } = await req.json()

    if (!contact || !code || !method) {
      return new Response(
        JSON.stringify({ error: 'contact, code, and method required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let valid = false

    if (method === 'phone') {
      // Verify via Twilio Verify
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifySid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: contact,
            Code: code,
          }),
        }
      )
      const data = await response.json()
      valid = data.status === 'approved'
    } else if (method === 'email') {
      // Verify stored code
      const { data: stored } = await supabase
        .from('otp_codes')
        .select('code, expires_at')
        .eq('contact', contact)
        .single()

      if (stored && new Date(stored.expires_at) > new Date()) {
        valid = stored.code === code
        if (valid) {
          await supabase.from('otp_codes').delete().eq('contact', contact)
        }
      }
    }

    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or get user
    let { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(contact)
    if (userError || !user) {
      // Try phone
      const { data: phoneUser } = await supabase.auth.admin.getUserByPhone(contact)
      user = phoneUser?.user
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: method === 'email' ? contact : undefined,
        phone: method === 'phone' ? contact : undefined,
        email_confirm: method === 'email',
        phone_confirm: method === 'phone',
        user_metadata: { device_id, attestation },
      })
      if (createError) throw createError
      user = newUser.user
    }

    // Create session token (custom JWT)
    const sessionToken = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/auth/callback` },
    })

    // In production, create a custom JWT with device binding
    const customToken = btoa(JSON.stringify({
      sub: user.id,
      device_id,
      attestation,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    }))

    return new Response(
      JSON.stringify({
        success: true,
        session_token: customToken,
        user: { id: user.id, email: user.email, phone: user.phone },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('verify-otp error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})