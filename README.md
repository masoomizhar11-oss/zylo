# Zylo (ザイロ) — Web PWA

> **Your true virtual identity. Local. Mood-matched. Human-verified.**

A hyper-local, mood-aware social commerce platform built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- 🎨 **Splash Logo Ritual** — Ink-brush animation drawing 「ザイロ」 with shakuhachi audio
- 🔐 **Sybil-proof Identity** — OTP (phone/email) + Device Attestation (Play Integrity / DeviceCheck) + Behavioral Biometrics
- 📍 **Proximity Discovery** — Geohash-based zones via browser Geolocation API + Supabase Realtime
- 🎭 **Mood-Graph Matching** — Real-time mood vectors → weighted affinity scoring → ephemeral "zones"
- 🎨 **Creator Commerce** — Listings with multi-currency pricing (Stripe + Razorpay UPI + Crypto)
- 💬 **E2E Encrypted Chat** — Signal Protocol over WebRTC (future)
- 🌐 **PWA Ready** — Installable, offline-capable, push notifications

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS 3.4 |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth + Custom OTP + Device Attestation |
| Payments | Stripe Connect + Razorpay (UPI) + Coinbase Commerce |
| Proximity | Browser Geolocation + Geohash + Supabase Realtime |
| Real-time | Supabase Realtime (WebSocket) |
| Deployment | Vercel |

## Quick Start

### 1. Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Supabase account
- Stripe account (for payments)
- Twilio + SendGrid (for OTP)
- Google Cloud (for Play Integrity)

### 2. Install Dependencies

```bash
cd zylo-web
pnpm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Fill in all required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay (UPI/INR)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...

# SendGrid (Email OTP)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@zylo.app
SENDGRID_OTP_TEMPLATE_ID=d-...

# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=...
HCAPTCHA_SECRET_KEY=...

# Play Integrity
PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER=...
GOOGLE_PLAY_INTEGRITY_KEY=projects/.../locations/global/keys/...
GOOGLE_ACCESS_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Enable Realtime for tables: `profiles`, `proximity_events`, `catalog_items`, `purchases`, `notifications`, `chat_messages`

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
pnpm add -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy verify-attestation
supabase functions deploy stripe-connect-link
supabase functions deploy stripe-webhook
supabase functions deploy proximity-sync
supabase functions deploy proximity-nearby
```

### 6. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
zylo-web/
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind + design system
│   │   ├── layout.tsx           # Root layout + fonts
│   │   ├── page.tsx             # Main entry (splash → onboarding → home)
│   │   └── middleware.ts        # Auth middleware
│   ├── components/
│   │   ├── SplashScreen.tsx     # 「ザイロ」 ink-brush animation
│   │   ├── OnboardingFlow.tsx   # 4-step questionnaire
│   │   └── HomeZone.tsx         # Nearby users + mood selector
│   ├── lib/
│   │   ├── geohash.ts           # Geohash encoding/decoding
│   │   └── supabase.ts          # Supabase clients
│   └── types/
│       └── database.ts          # TypeScript types
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── send-otp/
│       ├── verify-otp/
│       ├── verify-attestation/
│       ├── stripe-connect-link/
│       ├── stripe-webhook/
│       ├── proximity-sync/
│       └── proximity-nearby/
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── site.webmanifest
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

## Key Components

### SplashScreen.tsx
- Canvas-based animation drawing 「ザイロ」 stroke-by-stroke
- Paper texture background with noise
- Vermilion seal stamp (在朗) with elastic animation
- Web Audio API shakuhachi tone
- Respects `prefers-reduced-motion`

### OnboardingFlow.tsx
4 steps:
1. **Interests** — Pick 3-5 from 16 categories
2. **Mood** — Select current vibe (8 moods)
3. **Mode** — Creator / Explorer / Both
4. **Radius** — 100m to Global

### HomeZone.tsx
- Geolocation → Geohash4 → Supabase Realtime subscription
- Horizontal mood chip selector (updates beacon in real-time)
- Nearby user cards with affinity %, distance, mutual interests
- Bottom navigation (Home, Explore, Create, Messages, Profile)

## Affinity Algorithm

```
affinity = 0.35 × interestOverlap
         + 0.30 × moodAlignment
         + 0.20 × proximityFactor
         + 0.10 × trustBoost
         - 0.05 × recencyPenalty
```

Threshold for zone entry: **≥ 62%**

## Device Attestation

| Platform | Method | Verdict |
|----------|--------|---------|
| Android | Play Integrity API | MEETS_STRONG_INTEGRITY → PASS |
| iOS | DeviceCheck / App Attest | Requires server verification |
| Web | Firebase App Check (reCAPTCHA) | Valid token → PASS |

## PWA Checklist

- [x] Web App Manifest (`site.webmanifest`)
- [x] Service Worker (auto-generated by Next.js)
- [x] Offline fallback
- [x] Install prompt
- [x] Push notifications (via Supabase Realtime)
- [x] App icons (all sizes)
- [x] Splash screens

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Supabase Edge Functions

Deployed via Supabase CLI (see step 5 above).

### Stripe Webhook

Configure in Stripe Dashboard:
- Endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- Events: `payment_intent.succeeded`, `account.updated`, `transfer.created`

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler
```

## License

MIT — Build with craft. Ship with soul.

**Zylo — ザイロ — Your true virtual identity.**