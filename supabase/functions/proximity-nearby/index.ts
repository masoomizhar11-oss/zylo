import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mood vectors for affinity calculation
const MOOD_VECTORS: Record<string, number[]> = {
  artistic: [1, 0, 0, 0, 0, 0, 0, 0],
  reading: [0, 1, 0, 0, 0, 0, 0, 0],
  moody: [0, 0, 1, 0, 0, 0, 0, 0],
  calm: [0, 0, 0, 1, 0, 0, 0, 0],
  hype: [0, 0, 0, 0, 1, 0, 0, 0],
  deep_thought: [0, 0, 0, 0, 0, 1, 0, 0],
  social: [0, 0, 0, 0, 0, 0, 1, 0],
  focused: [0, 0, 0, 0, 0, 0, 0, 1],
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const geohash4 = url.searchParams.get('geohash4')
    const mood = url.searchParams.get('mood')
    const radius = parseInt(url.searchParams.get('radius') || '5000')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const userId = url.searchParams.get('user_id')

    if (!geohash4) {
      return new Response(
        JSON.stringify({ error: 'geohash4 required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get nearby users from proximity_events (recent, within 10 min)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    let query = supabase
      .from('proximity_events')
      .select(`
        user_id,
        geohash4,
        mood,
        interests,
        distance_meters,
        rssi,
        created_at,
        profiles!inner (
          id,
          display_name,
          avatar_url,
          monologue,
          interests,
          mood_vector,
          radius_meters,
          profile_complete,
          trust_score
        )
      `)
      .eq('geohash4', geohash4)
      .gte('created_at', tenMinAgo)
      .neq('user_id', userId || '')
      .limit(100)

    const { data: events, error } = await query

    if (error) throw error

    // Calculate affinity for each user
    const userMoodVector = mood ? MOOD_VECTORS[mood] : [0, 0, 0, 0, 0, 0, 0, 0]
    const userInterests = [] // Would come from request in real implementation

    const usersWithAffinity = (events || [])
      .filter(e => e.profiles.profile_complete)
      .map(e => {
        const profile = e.profiles
        const distance = e.distance_meters || profile.radius_meters || radius

        // Interest overlap
        const interestOverlap = jaccardSimilarity(userInterests, profile.interests || [])

        // Mood alignment
        const profileMoodVector = profile.mood_vector || [0, 0, 0, 0, 0, 0, 0, 0]
        const moodAlignment = cosineSimilarity(userMoodVector, profileMoodVector)

        // Proximity factor
        const proximityFactor = 1 - Math.min(distance / radius, 1)

        // Trust boost
        const trustBoost = (profile.trust_score || 0.5)

        // Affinity score
        const affinity = 0.35 * interestOverlap + 0.30 * moodAlignment + 0.20 * proximityFactor + 0.10 * trustBoost

        return {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          mood: e.mood,
          distance_meters: distance,
          interests: profile.interests || [],
          affinity: Math.round(affinity * 100),
          monologue: profile.monologue,
        }
      })
      .filter(u => u.affinity >= 62) // Threshold
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, limit)

    return new Response(
      JSON.stringify({ users: usersWithAffinity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('proximity-nearby error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})