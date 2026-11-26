'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

interface OnboardingFlowProps {
  onComplete: (userData: { id: string; profileComplete: boolean }) => void
  userId?: string
}

const INTERESTS = [
  { id: 'art', label: 'Art & Design', icon: '🎨' },
  { id: 'books', label: 'Books & Writing', icon: '📚' },
  { id: 'code', label: 'Code & Tech', icon: '💻' },
  { id: 'music', label: 'Music & Audio', icon: '🎵' },
  { id: 'food', label: 'Food & Cooking', icon: '🍳' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
  { id: 'tech', label: 'Gadgets & AI', icon: '🤖' },
  { id: 'fashion', label: 'Fashion & Style', icon: '👗' },
  { id: 'film', label: 'Film & Photo', icon: '📷' },
  { id: 'games', label: 'Games & Play', icon: '🎮' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'social', label: 'Community', icon: '🤝' },
  { id: 'other', label: 'Other', icon: '✨' },
]

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

const MODES = [
  { id: 'creator', label: 'I create', desc: 'Art, writing, code, music...', icon: '🎨' },
  { id: 'explorer', label: 'I explore', desc: 'Discover people & ideas', icon: '🔍' },
  { id: 'both', label: 'Both', desc: 'Create and discover', icon: '⚖️' },
]

const RADII = [
  { id: '100', label: '100 m', desc: 'Right around you' },
  { id: '500', label: '500 m', desc: 'Your block' },
  { id: '1000', label: '1 km', desc: 'Neighborhood' },
  { id: '5000', label: '5 km', desc: 'Across town' },
  { id: 'global', label: 'Global', desc: 'Anywhere' },
]

export default function OnboardingFlow({ onComplete, userId }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    interests: [] as string[],
    mood: '' as string,
    mode: '' as string,
    radius: '' as string,
  })

  const steps = [
    { title: 'What interests you?', subtitle: 'Pick 3–5 things you love' },
    { title: 'How are you feeling?', subtitle: 'Sets your initial mood zone' },
    { title: 'Create or discover?', subtitle: 'How you\'ll show up' },
    { title: 'How far to reach?', subtitle: 'Your discovery radius' },
  ]

  const canContinue = useMemo(() => {
    if (step === 0) return formData.interests.length >= 3
    if (step === 1) return !!formData.mood
    if (step === 2) return !!formData.mode
    if (step === 3) return !!formData.radius
    return false
  }, [step, formData])

  const handleNext = useCallback(async () => {
    if (!canContinue) return
    if (step < 3) {
      setStep(step + 1)
    } else {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(r => setTimeout(r, 500))
        const newUser = {
          id: userId || `user_${Date.now()}`,
          profileComplete: true,
        }
        onComplete(newUser)
      } catch {
        alert('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }, [step, canContinue, formData, userId, onComplete])

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1)
  }, [step])

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#d2d2d7] dark:bg-[#3a3a3c] z-40">
        <div
          className="h-full bg-[#0071e3] transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 pt-20 max-w-md w-full mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4}>
          {steps.map((_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i < step
                    ? 'bg-[#0071e3] text-white'
                    : i === step
                    ? 'bg-[#0071e3]/10 text-[#0071e3] border-2 border-[#0071e3]'
                    : 'bg-[#d2d2d7] dark:bg-[#3a3a3c] text-[#86868b]'
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`w-16 h-[3px] mx-2 transition-all ${
                    i < step ? 'bg-[#0071e3]' : 'bg-[#d2d2d7] dark:bg-[#3a3a3c]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="w-full animate-slide-up">
          <h1 className="section-title text-center mb-2">{steps[step].title}</h1>
          <p className="section-subtitle text-center mb-12">{steps[step].subtitle}</p>

          {step === 0 && (
            <InterestsGrid
              interests={INTERESTS}
              selected={formData.interests}
              onChange={(interests) => setFormData(prev => ({ ...prev, interests }))}
            />
          )}

          {step === 1 && (
            <MoodSelector
              moods={MOODS}
              selected={formData.mood}
              onSelect={(mood) => setFormData(prev => ({ ...prev, mood }))}
            />
          )}

          {step === 2 && (
            <ModeSelector
              modes={MODES}
              selected={formData.mode}
              onSelect={(mode) => setFormData(prev => ({ ...prev, mode }))}
            />
          )}

          {step === 3 && (
            <RadiusSelector
              radii={RADII}
              selected={formData.radius}
              onSelect={(radius) => setFormData(prev => ({ ...prev, radius }))}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between w-full">
          <button
            onClick={handleBack}
            disabled={step === 0 || loading}
            className="btn-ghost text-[#86868b] hover:text-black dark:hover:text-white disabled:opacity-30"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="sr-only">Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!canContinue || loading}
            className="btn-primary flex items-center gap-2"
          >
            {step === 3 ? 'Enter Zylo' : 'Continue'}
            {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </main>
    </div>
  )
}

function InterestsGrid({
  interests,
  selected,
  onChange,
}: {
  interests: typeof INTERESTS
  selected: string[]
  onChange: (interests: string[]) => void
}) {
  const toggle = (id: string) => {
    const newSelection = selected.includes(id)
      ? selected.filter(i => i !== id)
      : [...selected, id].slice(0, 5)
    onChange(newSelection)
  }

  return (
    <div className="grid grid-cols-4 gap-3" role="group" aria-label="Select your interests">
      {interests.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => toggle(id)}
          className={`relative aspect-square rounded-xl border transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
            selected.includes(id)
              ? 'border-[#0071e3] bg-[#0071e3]/5'
              : 'border-[#d2d2d7] dark:border-[#3a3a3c] hover:border-[#0071e3]/50 hover:bg-[#0071e3]/5'
          }`}
          aria-pressed={selected.includes(id)}
        >
          <span className="text-3xl">{icon}</span>
          <span className="text-sm font-medium text-black dark:text-white text-center px-2">{label}</span>
          {selected.includes(id) && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0071e3] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function MoodSelector({
  moods,
  selected,
  onSelect,
}: {
  moods: typeof MOODS
  selected: string
  onSelect: (mood: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-3" role="group" aria-label="Select your mood">
      {moods.map(({ id, label, emoji }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`chip ${selected === id ? 'chip-active' : ''} h-14 flex-col gap-1`}
          aria-pressed={selected === id}
        >
          <span className="text-xl">{emoji}</span>
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  )
}

function ModeSelector({
  modes,
  selected,
  onSelect,
}: {
  modes: typeof MODES
  selected: string
  onSelect: (mode: string) => void
}) {
  return (
    <div className="space-y-3" role="group" aria-label="Choose your mode">
      {modes.map(({ id, label, desc, icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`w-full relative p-5 rounded-xl border transition-all text-left ${
            selected === id
              ? 'border-[#0071e3] bg-[#0071e3]/5'
              : 'border-[#d2d2d7] dark:border-[#3a3a3c] hover:border-[#0071e3]/50 hover:bg-[#0071e3]/5'
          }`}
          aria-pressed={selected === id}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="font-medium text-black dark:text-white">{label}</p>
              <p className="text-sm text-[#86868b]">{desc}</p>
            </div>
          </div>
          {selected === id && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#0071e3] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function RadiusSelector({
  radii,
  selected,
  onSelect,
}: {
  radii: typeof RADII
  selected: string
  onSelect: (radius: string) => void
}) {
  return (
    <div className="space-y-3" role="group" aria-label="Choose your discovery radius">
      {radii.map(({ id, label, desc }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`w-full relative p-5 rounded-xl border transition-all text-left ${
            selected === id
              ? 'border-[#0071e3] bg-[#0071e3]/5'
              : 'border-[#d2d2d7] dark:border-[#3a3a3c] hover:border-[#0071e3]/50 hover:bg-[#0071e3]/5'
          }`}
          aria-pressed={selected === id}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-black dark:text-white">{label}</p>
              <p className="text-sm text-[#86868b]">{desc}</p>
            </div>
            <span className="text-xl font-mono text-[#86868b]">
              {id === 'global' ? '∞' : `${parseInt(id) / 1000}km`}
            </span>
          </div>
          {selected === id && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#0071e3] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}