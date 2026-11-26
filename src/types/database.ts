// Database types for Zylo - generated from Supabase schema

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  monologue: string | null
  interests: string[]
  mood_vector: number[] // 8-dim vector for mood matching
  mode: 'creator' | 'explorer' | 'both'
  radius_meters: number
  geohash4: string | null
  latitude: number | null
  longitude: number | null
  profile_complete: boolean
  trust_score: number
  created_at: string
  updated_at: string
}

export interface CatalogItem {
  id: string
  creator_id: string
  type: 'art' | 'book' | 'music' | 'course' | 'other'
  title: string
  description: string | null
  media_urls: string[]
  price_cents: number
  currency: string
  royalty_bps: number
  inventory: number
  tags: string[]
  status: 'draft' | 'active' | 'paused' | 'sold_out'
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  buyer_id: string
  item_id: string
  amount_cents: number
  currency: string
  platform_fee_cents: number
  creator_earnings_cents: number
  stripe_payment_intent_id: string | null
  razorpay_order_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  delivered_at: string | null
  created_at: string
}

export interface SocialLink {
  id: string
  profile_id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'github' | 'website'
  url: string
  username: string | null
  verified: boolean
  follower_count: number | null
  created_at: string
  updated_at: string
}

export interface Monologue {
  id: string
  profile_id: string
  content: string
  audio_url: string | null
  mood: string | null
  pinned: boolean
  expires_at: string | null
  created_at: string
}

export interface ProximityEvent {
  id: string
  user_id: string
  geohash4: string
  mood: string
  interests: string[]
  distance_meters: number | null
  rssi: number | null
  created_at: string
}

export interface Endorsement {
  id: string
  from_profile_id: string
  to_profile_id: string
  type: 'human' | 'creator' | 'reliable' | 'kind'
  created_at: string
}

export interface Notification {
  id: string
  profile_id: string
  type: 'purchase' | 'message' | 'endorsement' | 'follow' | 'zone_enter' | 'system'
  title: string
  body: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

// Extended types for UI
export interface ProfileWithExtras extends Profile {
  catalog_items?: CatalogItem[]
  social_links?: SocialLink[]
  monologues?: Monologue[]
  earnings_total_cents?: number
  endorsement_count?: number
}

export interface NearbyUser {
  id: string
  display_name: string
  avatar_url: string | null
  mood: string
  distance_meters: number
  interests: string[]
  affinity: number
  monologue: string | null
}

export interface ZonePresence {
  user_id: string
  geohash4: string
  mood: string
  interests: string[]
  last_seen: string
}

// Mood types
export type MoodTag =
  | 'artistic'
  | 'reading'
  | 'moody'
  | 'calm'
  | 'hype'
  | 'deep_thought'
  | 'social'
  | 'focused'

export const MOOD_TAGS: MoodTag[] = [
  'artistic',
  'reading',
  'moody',
  'calm',
  'hype',
  'deep_thought',
  'social',
  'focused',
]

export const MOOD_LABELS: Record<MoodTag, { label: string; emoji: string }> = {
  artistic: { label: 'Artistic', emoji: '🎨' },
  reading: { label: 'Reading', emoji: '📖' },
  moody: { label: 'Moody', emoji: '😔' },
  calm: { label: 'Calm', emoji: '🧘' },
  hype: { label: 'Hype', emoji: '🚀' },
  deep_thought: { label: 'Deep Thought', emoji: '💭' },
  social: { label: 'Social', emoji: '🗣️' },
  focused: { label: 'Focused', emoji: '🎯' },
}

// Interest categories (64 total)
export const INTEREST_CATEGORIES = [
  'art', 'design', 'photography', 'illustration', 'painting', 'sculpture', 'digital-art', 'crafts',
  'books', 'writing', 'poetry', 'fiction', 'nonfiction', 'comics', 'manga', 'journalism',
  'code', 'web-dev', 'mobile-dev', 'ai-ml', 'blockchain', 'open-source', 'devops', 'security',
  'music', 'production', 'instrument', 'singing', 'dj', 'sound-design', 'live-music', 'vinyl',
  'food', 'cooking', 'baking', 'restaurants', 'wine', 'coffee', 'nutrition', 'food-photography',
  'nature', 'hiking', 'camping', 'gardening', 'birdwatching', 'astronomy', 'conservation', 'foraging',
  'tech', 'gadgets', 'vr-ar', 'robotics', 'iot', '3d-printing', 'drones', 'smart-home',
  'fashion', 'styling', 'thrifting', 'sewing', 'jewelry', 'sneakers', 'streetwear', 'vintage',
  'film', 'photography', 'videography', 'cinema', 'analog', 'editing', 'screenwriting', 'acting',
  'games', 'board-games', 'video-games', 'rpg', 'esports', 'game-dev', 'speedrunning', 'collecting',
  'wellness', 'meditation', 'yoga', 'fitness', 'running', 'therapy', 'sleep', 'breathwork',
  'business', 'startups', 'investing', 'marketing', 'product', 'sales', 'leadership', 'networking',
  'science', 'physics', 'biology', 'chemistry', 'neuroscience', 'space', 'climate', 'research',
  'travel', 'culture', 'languages', 'history', 'architecture', 'museums', 'festivals', 'nomad',
  'social', 'community', 'events', 'volunteering', 'activism', 'meetups', 'hosting', 'mentoring',
  'other', 'curiosity', 'learning', 'experiments', 'projects', 'hobbies', 'collections', 'diy',
] as const

export type InterestCategory = typeof INTEREST_CATEGORIES[number]