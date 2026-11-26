'use client'

import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'done'>('logo')
  const [opacity, setOpacity] = useState(0)
  const [scale, setScale] = useState(0.8)

  useEffect(() => {
    // Phase 1: Logo appears
    requestAnimationFrame(() => {
      setOpacity(1)
      setScale(1)
    })

    const timer1 = setTimeout(() => {
      setPhase('text')
    }, 800)

    // Phase 2: Text appears
    const timer2 = setTimeout(() => {
      setPhase('done')
    }, 1600)

    // Phase 3: Complete
    const timer3 = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black"
      style={{ opacity: phase === 'done' ? 0 : 1 }}
      role="img"
      aria-label="Zylo logo"
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{
          opacity: phase === 'logo' || phase === 'text' ? opacity : 0,
          transform: `scale(${scale})`,
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
        }}
      >
        {/* Logo Mark */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="64" height="64" rx="16" fill="currentColor" className="text-black dark:text-white" />
          <path
            d="M32 16L40 24L40 40L32 48L24 40L24 24L32 16Z"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white dark:text-black"
          />
          <path
            d="M32 24V40"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-white dark:text-black"
          />
          <path
            d="M24 32H40"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-white dark:text-black"
          />
        </svg>

        {/* Wordmark */}
        <span
          className="text-3xl font-medium tracking-tight text-black dark:text-white"
          style={{
            opacity: phase === 'text' ? opacity : 0,
            transform: phase === 'text' ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease-out 0.2s, transform 0.4s ease-out 0.2s'
          }}
        >
          Zylo
        </span>
      </div>

      {/* Japanese subtitle */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2"
        style={{
          opacity: phase === 'text' ? opacity : 0,
          transition: 'opacity 0.4s ease-out 0.4s'
        }}
      >
        <span className="text-sm text-[#86868b] font-medium tracking-wide">ザイロ</span>
      </div>
    </div>
  )
}