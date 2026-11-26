'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { MapPin, User, Settings, ChevronDown, MessageSquare, Compass, Plus, Home } from 'lucide-react'
import { geohash } from '@/lib/geohash'

interface HomeZoneProps {
  userId?: string
  onLogout: () => void
}

const MOODS = [
  { id: 'artistic', label: 'Artistic', emoji: '🎨' },
  { id: 'reading', label: 'Reading', emoji: '📖' },
  { id: 'moody', label: 'Moody', emoji: '😔' },
  { id: 'calm', label: 'Calm', emoji: '🧘' },
  { id: 'hype', label: 'Hype', emoji: '🚀' },
  { id: 'deep_thought', label: 'Deep Thought', emoji: '💭' },
  { id: 'social', label: 'Social', emoji: '🗣️' },
  { id: 'focused', label: 'Focused', emoji: '🎯' },
]

const MOCK_USERS = [
  { id: '1', name: 'Akira', mood: 'artistic', distance: 120, interests: ['art', 'design', 'photography'], avatar: null },
  { id: '2', name: 'Mei', mood: 'reading', distance: 340, interests: ['books', 'writing', 'coffee'], avatar: null },
  { id: '3', name: 'Kenji', mood: 'hype', distance: 580, interests: ['music', 'tech', 'games'], avatar: null },
  { id: '4', name: 'Yuki', mood: 'calm', distance: 890, interests: ['wellness', 'nature', 'tea'], avatar: null },
  { id: '5', name: 'Sora', mood: 'deep_thought', distance: 1200, interests: ['philosophy', 'code', 'science'], avatar: null },
  { id: '6', name: 'Hana', mood: 'social', distance: 2100, interests: ['community', 'events', 'food'], avatar: null },
]

export default function HomeZone({ userId, onLogout }: HomeZoneProps) {
  const [currentMood, setCurrentMood] = useState('calm')
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [geohash4, setGeohash4] = useState('')
  const [radius, setRadius] = useState(5000)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      loadMockUsers()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(loc)
        const gh = geohash.encode(loc.lat, loc.lng, 4)
        setGeohash4(gh)
        loadNearbyUsers(gh)
      },
      () => loadMockUsers(),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  const loadNearbyUsers = useCallback((gh: string) => {
    setTimeout(() => {
      const users = MOCK_USERS.map(u => ({
        ...u,
        affinity: calculateAffinity(u),
      })).sort((a, b) => b.affinity - a.affinity)
      setNearbyUsers(users)
      setLoading(false)
    }, 500)
  }, [])

  const loadMockUsers = useCallback(() => {
    const users = MOCK_USERS.map(u => ({
      ...u,
      affinity: calculateAffinity(u),
    })).sort((a, b) => b.affinity - a.affinity)
    setNearbyUsers(users)
    setLoading(false)
  }, [])

  const calculateAffinity = (user: any) => {
    const moodMatch = user.mood === currentMood ? 0.4 : 0.1
    const interestOverlap = user.interests.filter((i: string) =>
      getMoodInterests(currentMood).includes(i)
    ).length / 3
    const proximity = 1 - Math.min(user.distance / radius, 1)
    return Math.round((moodMatch + interestOverlap * 0.3 + proximity * 0.3) * 100)
  }

  const getMoodInterests = (mood: string) => {
    const map: Record<string, string[]> = {
      artistic: ['art', 'design', 'photography', 'fashion', 'film'],
      reading: ['books', 'writing', 'philosophy', 'science'],
      moody: ['music', 'philosophy', 'art'],
      calm: ['wellness', 'nature', 'tea', 'meditation'],
      hype: ['music', 'tech', 'games', 'events'],
      deep_thought: ['philosophy', 'science', 'code', 'books'],
      social: ['community', 'events', 'food', 'travel'],
      focused: ['code', 'business', 'design', 'writing'],
    }
    return map[mood] || []
  }

  const handleMoodChange = (mood: string) => {
    setCurrentMood(mood)
    setShowMoodPicker(false)
    const users = nearbyUsers.map(u => ({
      ...u,
      affinity: calculateAffinity({ ...u, mood: u.mood }),
    })).sort((a, b) => b.affinity - a.affinity)
    setNearbyUsers(users)
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const currentMoodInfo = MOODS.find(m => m.id === currentMood)

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-[#d2d2d7] dark:border-[#3a3a3c] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="64" height="64" rx="16" fill="currentColor" className="text-black dark:text-white" />
              <path d="M32 16L40 24L40 40L32 48L24 40L24 24L32 16Z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-black" />
              <path d="M32 24V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white dark:text-black" />
              <path d="M24 32H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white dark:text-black" />
            </svg>
            <span className="text-xl font-medium tracking-tight text-black dark:text-white">Zylo</span>
            <span className="text-xs text-[#86868b] uppercase tracking-wider">ザイロ</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfile(true)} className="btn-ghost p-2" aria-label="Profile">
              <User className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="btn-ghost p-2" aria-label="Log out">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mood Selector */}
      <div className="px-6 py-4 border-b border-[#d2d2d7] dark:border-[#3a3a3c] bg-white/50 dark:bg-black/50">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#d2d2d7] dark:border-[#3a3a3c] bg-white dark:bg-[#1d1d1f] transition-all hover:border-[#0071e3]/50"
            aria-expanded={showMoodPicker}
            aria-haspopup="listbox"
          >
            <span className="text-2xl">{currentMoodInfo?.emoji || '🧘'}</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#86868b]">Current mood</p>
              <p className="font-medium text-black dark:text-white capitalize">
                {currentMoodInfo?.label || 'Calm'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#86868b]">
              <MapPin className="w-4 h-4" />
              <ChevronDown className={`w-4 h-4 transition-transform ${showMoodPicker ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showMoodPicker && (
            <div className="mt-3 animate-slide-up" role="listbox" aria-label="Select your mood">
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map(({ id, label, emoji }) => (
                  <button
                    key={id}
                    onClick={() => handleMoodChange(id)}
                    className={`chip ${currentMood === id ? 'chip-active' : ''} h-14 flex-col gap-1`}
                    role="option"
                    aria-selected={currentMood === id}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nearby Users */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-xl mx-auto">
          {/* Zone Info */}
          <div className="mb-6 flex items-center justify-between text-sm text-[#86868b]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {location
                  ? `Zone: ${geohash4} • Radius: ${radius / 1000}km`
                  : 'Location access needed for precise zones'}
              </span>
            </div>
            <span>{nearbyUsers.length} nearby</span>
          </div>

          {/* User Cards */}
          {loading ? (
            <div className="space-y-4" aria-busy="true">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#d2d2d7] dark:bg-[#3a3a3c]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-[#d2d2d7] dark:bg-[#3a3a3c] rounded" />
                      <div className="h-3 w-1/2 bg-[#d2d2d7] dark:bg-[#3a3a3c] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#d2d2d7] dark:bg-[#3a3a3c] flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-[#86868b]" />
              </div>
              <h3 className="text-lg font-medium text-black dark:text-white mb-2">No one nearby right now</h3>
              <p className="text-[#86868b] mb-6">Expand your radius or change your mood to find your zone</p>
              <button onClick={() => setShowMoodPicker(true)} className="btn-secondary">
                Change mood
              </button>
            </div>
          ) : (
            <div className="space-y-4" role="list" aria-label="People in your zone">
              {nearbyUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentMood={currentMood}
                  formatDistance={formatDistance}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-[#d2d2d7] dark:border-[#3a3a3c] px-6 py-3 safe-bottom">
        <div className="max-w-xl mx-auto flex items-center justify-around">
          <button className="btn-ghost flex flex-col items-center gap-1 p-2 text-[#86868b]" aria-label="Home">
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button className="btn-ghost flex flex-col items-center gap-1 p-2 text-[#86868b]" aria-label="Explore">
            <Compass className="w-6 h-6" />
            <span className="text-xs">Explore</span>
          </button>
          <button className="btn-ghost flex flex-col items-center gap-1 p-2 text-[#86868b]" aria-label="Create">
            <Plus className="w-6 h-6" />
            <span className="text-xs">Create</span>
          </button>
          <button className="btn-ghost flex flex-col items-center gap-1 p-2 text-[#86868b]" aria-label="Messages">
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">Messages</span>
          </button>
          <button onClick={() => setShowProfile(true)} className="btn-ghost flex flex-col items-center gap-1 p-2 text-[#86868b]" aria-label="Profile">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* Profile Sheet */}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-2xl p-6 animate-slide-up max-w-sm mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">Profile</h2>
              <button onClick={() => setShowProfile(false)} className="btn-ghost p-1">✕</button>
            </div>
            <div className="space-y-4">
              <button className="btn-secondary w-full justify-start" onClick={() => { setShowProfile(false); alert('Settings coming soon'); }}>
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </button>
              <button className="btn-secondary w-full justify-start" onClick={onLogout}>
                <User className="w-5 h-5 mr-2" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserCard({
  user,
  currentMood,
  formatDistance,
}: {
  user: any
  currentMood: string
  formatDistance: (m: number) => string
}) {
  const moodInfo = MOODS.find(m => m.id === user.mood)
  const mutualInterests = user.interests.filter((i: string) =>
    getMoodInterests(currentMood).includes(i)
  )

  const getMoodInterests = (mood: string) => {
    const map: Record<string, string[]> = {
      artistic: ['art', 'design', 'photography', 'fashion', 'film'],
      reading: ['books', 'writing', 'philosophy', 'science'],
      moody: ['music', 'philosophy', 'art'],
      calm: ['wellness', 'nature', 'tea', 'meditation'],
      hype: ['music', 'tech', 'games', 'events'],
      deep_thought: ['philosophy', 'science', 'code', 'books'],
      social: ['community', 'events', 'food', 'travel'],
      focused: ['code', 'business', 'design', 'writing'],
    }
    return map[mood] || []
  }

  return (
    <article className="card p-4" role="listitem">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-[#0071e3]/10 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-medium text-[#0071e3]">
                {user.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-black flex items-center justify-center bg-[#0071e3]">
            <span className="text-[10px]">{moodInfo?.emoji}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-medium text-black dark:text-white truncate">{user.name}</h3>
              <p className="text-sm text-[#86868b] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(user.distance)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="text-xs font-mono text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                  {user.affinity}% match
                </span>
              </div>
            </div>
          </div>

          {/* Mood Badge */}
          <div className="mt-2 flex items-center gap-2">
            <span className="chip h-8 px-3 text-xs">
              <span>{moodInfo?.emoji}</span>
              <span className="capitalize">{moodInfo?.label}</span>
            </span>
          </div>

          {/* Mutual Interests */}
          {mutualInterests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mutualInterests.slice(0, 3).map((interest: string) => (
                <span
                  key={interest}
                  className="px-2 py-0.5 rounded-full bg-[#d2d2d7] dark:bg-[#3a3a3c] text-black dark:text-white text-xs border border-transparent"
                >
                  {interest}
                </span>
              ))}
              {mutualInterests.length > 3 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d2d2d7] dark:bg-[#3a3a3c] text-[#86868b] text-xs border border-transparent">
                  +{mutualInterests.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <button className="btn-ghost flex-1 justify-center gap-1.5 py-2" aria-label={`Connect with ${user.name}`}>
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Connect</span>
            </button>
            <button className="btn-secondary flex-1 justify-center gap-1.5 py-2" aria-label={`View ${user.name}'s profile`}>
              <User className="w-4 h-4" />
              <span className="text-sm">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}