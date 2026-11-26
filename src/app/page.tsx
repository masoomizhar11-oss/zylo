'use client'

import { useState, useEffect, useCallback } from 'react'
import SplashScreen from '@/components/SplashScreen'
import OnboardingFlow from '@/components/OnboardingFlow'
import HomeZone from '@/components/HomeZone'

type AppState = 'splash' | 'onboarding' | 'home'

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('splash')
  const [user, setUser] = useState<{ id: string; profileComplete: boolean } | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    // Check for existing session in localStorage
    const saved = localStorage.getItem('zylo_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        setAppState(parsed.profileComplete ? 'home' : 'onboarding')
      } catch {
        localStorage.removeItem('zylo_user')
        setAppState('splash')
      }
    } else {
      setAppState('splash')
    }
  }, [])

  const handleSplashComplete = useCallback(() => {
    if (user) {
      setAppState(user.profileComplete ? 'home' : 'onboarding')
    } else {
      setAppState('onboarding')
    }
  }, [user])

  const handleOnboardingComplete = useCallback((userData: { id: string; profileComplete: boolean }) => {
    setUser(userData)
    localStorage.setItem('zylo_user', JSON.stringify(userData))
    setAppState('home')
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('zylo_user')
    setAppState('splash')
  }, [])

  // Don't render until hydrated to avoid mismatch
  if (!hydrated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[17px] text-[#86868b]">Loading Zylo...</p>
        </div>
      </div>
    )
  }

  if (appState === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} userId={user?.id} />
  }

  return <HomeZone userId={user?.id} onLogout={handleLogout} />
}