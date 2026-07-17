# Journal IQ

Production-style AI journaling app (Expo SDK 54 + Express + Neon) for reflection and mood tracking.

## Structure

```
apps/backend      Node.js / Express / Prisma / JWT / OpenAI / Nodemailer (Gmail SMTP)
apps/mobile       Expo SDK 54 / Router v6 / NativeWind / Axios
packages/shared   Shared Zod schemas + prompt seed data
```

## Prerequisites

- Node.js 20+
- Expo Go (SDK 54) on your phone, or Android emulator
- Neon Postgres database
- Optional: `OPENAI_API_KEY`, Gmail SMTP (`SMTP_USER` + App Password) for reset emails

**Security:** If a Neon connection string was shared in chat, rotate the password in the Neon console and update `apps/backend/.env`.

## Setup

1. Copy env templates:

```bash
cp .env.example apps/backend/.env
# set DATABASE_URL, JWT secrets, optional API keys
```

2. Install & build shared package:

```bash
npm install
npm run build:shared
```

3. Migrate & seed:

```bash
cd apps/backend
npx prisma migrate deploy
npm run db:seed
```

For local schema experiments only, you can still use `npx prisma db push`. For real changes, create a migration with `npm run db:migrate:dev`.

4. Start backend:

```bash
npm run dev:backend
# http://localhost:4000/health
```

5. Start mobile (always from `apps/mobile`, or via the root workspace script — never `npx expo start` at the monorepo root):

```bash
# In apps/mobile/.env set EXPO_PUBLIC_API_URL
# Emulator: http://10.0.2.2:4000 (Android) or http://localhost:4000 (iOS sim)
# Physical device: http://YOUR_LAN_IP:4000  (or a Cloudflare tunnel URL)
cd apps/mobile
npx expo start --lan --clear
```

Or from the repo root: `npm run dev:mobile`

Scan the QR with Expo Go (SDK 54).

## Auth

- Sign up / Sign in / Sign out
- Forgot password (Nodemailer + Gmail SMTP; logs reset URL to API console if SMTP is not configured)
- JWT access (15m) + refresh rotation stored hashed in Postgres
- Mobile Axios client attaches Bearer token and refreshes on 401

## Features

- Daily rotating prompts + free-write
- Supportive AI reflection (gpt-4o-mini) with non-clinical guardrails
- Mood check-ins + weekly chart
- Weekly AI insights (mood + writing themes)
- Soft “showed up” streak on Home
- Local daily reminders (device)
- Optional PIN / biometric app lock (device-local)
- Account data export (JSON) + account delete
- In-app Privacy Policy & Terms (signup consent, Settings, onboarding)

## Legal pages (Play Console)

Host `docs/legal/privacy.html` and `docs/legal/terms.html` on any static host, then paste those URLs into Google Play Console. Optionally set `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_TERMS_URL` in the mobile env for external linking later.

Store listing copy (short + full description with the medical disclaimer) lives in `docs/store-listing.md`.

## Crash reporting (Sentry)

Sentry is deferred for Expo Go (conflicts with NativeWind’s Metro serializer). See `docs/sentry.md` for enabling it on EAS preview/production builds. Local development uses a no-op stub in `apps/mobile/src/lib/sentry.ts`.

## Password reset deep links

Reset emails use `journaliq://reset-password?token=…` (`MOBILE_RESET_URL`). Configure Gmail SMTP (`SMTP_*` in `apps/backend/.env`) with a Google App Password. Test on a **preview/production build** (not Expo Go): request forgot-password, tap the link, confirm the reset screen receives the token.
```bash
cd apps/mobile
npx eas-cli login
npx eas build -p android --profile preview
```

Add `eas.json` preview profile as needed after `eas init`.

