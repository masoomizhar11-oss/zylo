import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { events } = await req.json()

    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: 'events array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and insert proximity events
    const validEvents = events.map(e => ({
      user_id: e.user_id,
      geohash4: e.geohash4,
      mood: e.mood,
      interests: e.interests || [],
      distance_meters: e.distance_meters,
      rssi: e.rssi,
    }))

    const { error } = await supabase
      .from('proximity_events')
      .upsert(validEvents, { onConflict: 'user_id,geohash4' })

    if (error) throw error

    // Update user's geohash4 in profile
    for (const event of validEvents) {
      await supabase
        .from('profiles')
        .update({ geohash4: event.geohash4, updated_at: new Date().toISOString() })
        .eq('id', event.user_id)
    }

    return new Response(
      JSON.stringify({ success: true, count: validEvents.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('proximity-sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})