import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const googlePlayIntegrityKey = Deno.env.get('GOOGLE_PLAY_INTEGRITY_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platform, token, nonce } = await req.json()

    if (!platform || !token) {
      return new Response(
        JSON.stringify({ error: 'platform and token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let verdict: 'PASS' | 'WARN' | 'FAIL' = 'FAIL'
    let details: Record<string, any> = {}

    if (platform === 'android') {
      // Verify Play Integrity token
      const response = await fetch(
        `https://playintegrity.googleapis.com/v1/${googlePlayIntegrityKey}:decodeIntegrityToken?integrity_token=${token}`,
        {
          headers: { 'Authorization': `Bearer ${await getGoogleAccessToken()}` },
        }
      )

      if (response.ok) {
        const data = await response.json()
        details = data

        const deviceIntegrity = data.deviceIntegrity || {}
        const accountDetails = data.accountDetails || {}
        const appIntegrity = data.appIntegrity || {}

        const strong = deviceIntegrity.deviceRecognitionVerdict === 'MEETS_STRONG_INTEGRITY'
        const basic = deviceIntegrity.deviceRecognitionVerdict === 'MEETS_BASIC_INTEGRITY'
        const licensed = accountDetails.appLicensingVerdict === 'LICENSED'
        const genuine = appIntegrity.appRecognitionVerdict === 'PLAY_RECOGNIZED'

        if (strong && licensed && genuine) {
          verdict = 'PASS'
        } else if (basic && licensed) {
          verdict = 'WARN'
        }
      }
    } else if (platform === 'ios') {
      // Verify DeviceCheck/App Attest
      // This requires Apple's server-to-server verification
      // For now, accept with WARN
      verdict = 'WARN'
      details = { note: 'iOS attestation verification not fully implemented' }
    } else if (platform === 'web') {
      // Verify Firebase App Check (reCAPTCHA Enterprise)
      const response = await fetch(
        `https://firebaseappcheck.googleapis.com/v1beta/projects/${Deno.env.get('FIREBASE_PROJECT_ID')}/apps/${Deno.env.get('FIREBASE_WEB_APP_ID')}:exchangeAppCheckToken`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_check_token: token }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        verdict = data.token ? 'PASS' : 'FAIL'
      }
    }

    return new Response(
      JSON.stringify({ verdict, details }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('verify-attestation error:', error)
    return new Response(
      JSON.stringify({ verdict: 'FAIL', error: 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getGoogleAccessToken(): Promise<string> {
  // Use service account to get access token
  // Implementation depends on your GCP setup
  return Deno.env.get('GOOGLE_ACCESS_TOKEN') || ''
}