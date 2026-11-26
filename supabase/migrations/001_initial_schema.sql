-- Zylo Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  monologue TEXT,
  interests TEXT[] DEFAULT '{}',
  mood_vector REAL[8] DEFAULT '{0,0,0,0,0,0,0,0}',
  mode TEXT CHECK (mode IN ('creator', 'explorer', 'both')) DEFAULT 'both',
  radius_meters INTEGER DEFAULT 5000,
  geohash4 TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  profile_complete BOOLEAN DEFAULT FALSE,
  trust_score REAL DEFAULT 0.5,
  stripe_account_id TEXT,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Catalog items
CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('art', 'book', 'music', 'course', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  media_urls TEXT[] DEFAULT '{}',
  price_cents INTEGER NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  royalty_bps INTEGER DEFAULT 0,
  inventory INTEGER DEFAULT -1,
  tags TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'sold_out')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog items are viewable by everyone" ON catalog_items
  FOR SELECT USING (status = 'active');

CREATE POLICY "Creators can manage their items" ON catalog_items
  FOR ALL USING (auth.uid() = creator_id);

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  creator_earnings_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  razorpay_order_id TEXT,
  coinbase_charge_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their purchases" ON purchases
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view purchases of their items" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalog_items
      WHERE catalog_items.id = purchases.item_id
      AND catalog_items.creator_id = auth.uid()
    )
  );

CREATE POLICY "System can insert purchases" ON purchases
  FOR INSERT WITH CHECK (true);

-- Social links
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'github', 'website')),
  url TEXT NOT NULL,
  username TEXT,
  verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social links are viewable by everyone" ON social_links
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their social links" ON social_links
  FOR ALL USING (auth.uid() = profile_id);

-- Monologues (ephemeral posts)
CREATE TABLE monologues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  audio_url TEXT,
  mood TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE monologues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Monologues are viewable by everyone" ON monologues
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "Users can manage their monologues" ON monologues
  FOR ALL USING (auth.uid() = profile_id);

-- Proximity events (for local discovery)
CREATE TABLE proximity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  geohash4 TEXT NOT NULL,
  mood TEXT,
  interests TEXT[],
  distance_meters INTEGER,
  rssi INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proximity_events_geohash4 ON proximity_events(geohash4);
CREATE INDEX idx_proximity_events_created_at ON proximity_events(created_at DESC);

ALTER TABLE proximity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proximity events are viewable by everyone" ON proximity_events
  FOR SELECT USING (true);

CREATE POLICY "System can insert proximity events" ON proximity_events
  FOR INSERT WITH CHECK (true);

-- Endorsements (trust building)
CREATE TABLE endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('human', 'creator', 'reliable', 'kind')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_profile_id, to_profile_id, type)
);

ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Endorsements are viewable by everyone" ON endorsements
  FOR SELECT USING (true);

CREATE POLICY "Users can create endorsements" ON endorsements
  FOR INSERT WITH CHECK (auth.uid() = from_profile_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('purchase', 'message', 'endorsement', 'follow', 'zone_enter', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Chat messages (E2E encrypted)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'audio', 'file')) DEFAULT 'text',
  ephemeral_timer INTERVAL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_messages.conversation_id
      AND chat_participants.profile_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_messages.conversation_id
      AND chat_participants.profile_id = auth.uid()
    )
  );

-- Chat participants
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(conversation_id, profile_id)
);

ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversation members" ON chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.conversation_id = chat_participants.conversation_id
      AND cp.profile_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_items_updated_at BEFORE UPDATE ON catalog_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get nearby users
CREATE OR REPLACE FUNCTION get_nearby_users(
  p_geohash4 TEXT,
  p_mood TEXT,
  p_interests TEXT[],
  p_radius_meters INTEGER,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  mood TEXT,
  distance_meters INTEGER,
  interests TEXT[],
  affinity REAL,
  monologue TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.mood_vector[1] AS mood, -- Simplified: would need proper mood extraction
    COALESCE(pe.distance_meters, p.radius_meters) AS distance_meters,
    p.interests,
    0.5 AS affinity, -- Placeholder for actual affinity calculation
    p.monologue
  FROM profiles p
  LEFT JOIN proximity_events pe ON pe.user_id = p.id AND pe.geohash4 = p_geohash4
  WHERE p.geohash4 = p_geohash4
    AND p.id != auth.uid()
    AND p.profile_complete = TRUE
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;