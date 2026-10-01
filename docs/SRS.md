# Software Requirements Specification (SRS)

## Journal IQ

| Field | Value |
| --- | --- |
| **Document title** | Software Requirements Specification — Journal IQ |
| **Product name** | Journal IQ |
| **Version** | 1.0.0 |
| **Status** | Baseline (as implemented) |
| **Last updated** | September 28, 2026 |
| **Document type** | IEEE 830–inspired SRS |
| **Audience** | Product, engineering, QA, compliance, store review |

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Overall description](#2-overall-description)
3. [System features and functional requirements](#3-system-features-and-functional-requirements)
4. [External interface requirements](#4-external-interface-requirements)
5. [Non-functional requirements](#5-non-functional-requirements)
6. [Data requirements](#6-data-requirements)
7. [Constraints, assumptions, and dependencies](#7-constraints-assumptions-and-dependencies)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for **Journal IQ**, a private AI-assisted journaling and mood-tracking application. It is the authoritative product/engineering reference for what the system shall do, how it shall behave, and what it explicitly shall not claim to be (therapy, diagnosis, or medical care).

### 1.2 Scope

Journal IQ provides:

- Account-based private journaling (prompt-based and free-write)
- Mood check-ins and weekly mood patterns
- Optional AI-generated supportive reflections and weekly insights
- Device-local reminders and optional PIN / biometric app lock
- Account data export and permanent account deletion
- In-app Privacy Policy and Terms of Service, with signup consent

**Out of scope (explicit non-goals):**

- Clinical therapy, counseling, diagnosis, or medical treatment
- Crisis intervention or emergency dispatch
- Social features (feeds, sharing entries publicly, messaging)
- Multi-user / shared journals
- Billing / subscriptions (not required for v1.0.0)

### 1.3 Definitions, acronyms, and abbreviations

| Term | Definition |
| --- | --- |
| **AI reflection** | Short, supportive, non-clinical text generated from a journal entry |
| **Weekly insight** | AI or fallback summary connecting recent moods and writing themes |
| **Free-write** | Journal entry not tied to a daily prompt |
| **Access token** | Short-lived JWT used to authorize API requests |
| **Refresh token** | Longer-lived credential; stored hashed server-side; used to rotate access tokens |
| **App lock** | Device-local PIN and/or biometric gate; credentials never sent to the API |
| **Crisis pattern** | Keyword heuristics that trigger a fixed safety message instead of generative AI |
| **SRS** | Software Requirements Specification |
| **JWT** | JSON Web Token |
| **SMTP** | Simple Mail Transfer Protocol (password-reset email delivery) |

### 1.4 References

| Reference | Location / note |
| --- | --- |
| Product README | Repository root `README.md` |
| Privacy Policy / Terms (in-app) | `apps/mobile/src/constants/legal.ts` |
| Store listing copy | `docs/store-listing.md` |
| Sentry notes | `docs/sentry.md` |
| Shared validation schemas | `packages/shared` |
| Prisma data model | `apps/backend/prisma/schema.prisma` |
| Expo SDK docs | https://docs.expo.dev/ (project targets current Expo SDK used by `apps/mobile`) |

### 1.5 Overview

Section 2 describes product context and users. Section 3 enumerates functional requirements. Section 4 covers interfaces (API, UI, email, AI). Section 5 covers quality attributes. Section 6 describes data. Section 7 lists constraints and assumptions. Section 8 provides requirement ID conventions and API summary.

---

## 2. Overall description

### 2.1 Product perspective

Journal IQ is a **monorepo** product with three primary packages:

```
apps/backend      Node.js / Express / Prisma / JWT / OpenAI / Nodemailer
apps/mobile       Expo (React Native) / Expo Router / NativeWind / Axios / Zustand
packages/shared   Shared Zod schemas + shared constants (e.g. mood labels)
```

**Runtime topology:**

```
┌─────────────────────┐         HTTPS / LAN          ┌──────────────────────┐
│  Mobile client      │ ───────────────────────────► │  Journal IQ API      │
│  (Expo / Expo Go)   │ ◄─────────────────────────── │  Express + Prisma    │
└─────────────────────┘   JSON + Bearer JWT          └──────────┬───────────┘
                                                                │
                     ┌──────────────────┬───────────────────────┼──────────────┐
                     ▼                  ▼                       ▼              ▼
              Neon Postgres      OpenAI API              Gmail SMTP      (optional)
              (journals,         (reflections /          (password       Sentry
               moods, auth)       weekly insights)        reset email)
```

### 2.2 Product functions (summary)

1. Register, sign in, sign out, and reset password
2. Complete first-run onboarding and acknowledge privacy posture
3. Write journal entries from a daily rotating prompt or free-write
4. Request an AI reflection for an entry
5. Log moods (1–5 scale) and view weekly stats / charts
6. Generate and view weekly AI insights
7. Track a soft “showed up” journaling streak on Home
8. Configure local daily reminders
9. Optionally lock the app with PIN / biometrics
10. Manage profile (name, timezone, local avatar)
11. Export account data (JSON) or delete the account
12. Read Privacy Policy and Terms in-app

### 2.3 User characteristics

| Persona | Description | Primary needs |
| --- | --- | --- |
| **Journaler** | Adult user seeking private reflection and mood awareness | Easy writing, gentle AI tone, privacy controls |
| **Returning user** | Has prior entries and moods | Continuity (history, streak, insights), quick check-in |
| **Security-conscious user** | Wants device and account privacy | App lock, export/delete, clear AI disclosure |

**Intended audience:** Adults. The product is **not directed at children under 13** (or the minimum age required in the user’s region).

### 2.4 Operating environment

| Layer | Requirement |
| --- | --- |
| Mobile | iOS and Android via Expo; portrait orientation; dark UI theme |
| Backend | Node.js ≥ 22.13; Express HTTP API |
| Database | PostgreSQL (Neon or compatible) |
| Email | Optional Gmail SMTP for password-reset delivery |
| AI | Optional OpenAI (`gpt-4o-mini`); deterministic fallbacks if unset |
| Dev client | Expo Go compatible with the project’s Expo SDK, or emulator / simulator |

### 2.5 Design and implementation constraints

- Shared request/response validation via Zod in `@journal-iq/shared`
- Passwords hashed (one-way); refresh and reset tokens stored hashed
- Helmet, CORS, and rate limiting on the API
- AI outputs must remain non-clinical (prompt guardrails + crisis heuristic)
- Device-local preferences (lock, reminders, avatar) must not be uploaded as account server data
- Medical disclaimer must remain visible and consistent with Privacy Policy / AI system prompts

### 2.6 Assumptions and dependencies

**Assumptions**

- Users have a network path to the API (`EXPO_PUBLIC_API_URL`)
- Users provide a valid email for account recovery
- Users understand Journal IQ is not a substitute for professional care

**Dependencies**

- Neon (or Postgres) availability
- Optional OpenAI availability (fallback text if missing)
- Optional SMTP configuration (reset URL logged to API console if SMTP unset)
- Device notification and biometric capabilities where those features are enabled

### 2.7 Apportioning of requirements

| Priority | Meaning |
| --- | --- |
| **Must** | Required for v1.0.0 acceptance |
| **Should** | Strongly expected; may degrade gracefully |
| **Could** | Nice-to-have / future |

All requirements in Section 3 are **Must** unless marked otherwise.

---

## 3. System features and functional requirements

Requirement IDs use the form `FR-<AREA>-NNN`.

### 3.1 Authentication and account lifecycle

#### FR-AUTH-001 — Sign up

The system shall allow a user to create an account with:

- Display name (1–80 characters)
- Email (unique, normalized to lowercase)
- Password (8–128 characters)

On success, the API shall return user profile fields plus access and refresh tokens (HTTP 201).

#### FR-AUTH-002 — Sign in

The system shall authenticate users with email and password and issue a new access/refresh token pair. Invalid credentials shall return HTTP 401 without revealing which field failed.

#### FR-AUTH-003 — Sign out / token revocation

The system shall support refresh-token rotation and revocation such that signed-out or rotated tokens cannot mint new access tokens.

#### FR-AUTH-004 — Access token lifetime

Access tokens shall be short-lived (target: approximately 15 minutes) and presented as Bearer tokens on protected routes.

#### FR-AUTH-005 — Forgot password

The system shall accept a forgot-password request by email, create a time-limited reset token (stored hashed), and attempt email delivery via SMTP. If SMTP is not configured, the system shall log the reset URL to the API console for development recovery. Forgot-password endpoints shall be rate-limited more strictly (target: 5 requests / 15 minutes per client).

#### FR-AUTH-006 — Reset password

The system shall allow password reset with a valid unused token and a new password meeting signup rules. Deep links (`journaliq://reset-password`) shall open the mobile reset flow when possible.

#### FR-AUTH-007 — Automatic token refresh (client)

The mobile Axios client shall attach the access token and, on HTTP 401, attempt refresh and retry the original request. Persistent auth failure shall clear the session and route the user to sign-in.

#### FR-AUTH-008 — Signup consent

Sign-up UI shall require acknowledgment of Privacy Policy and Terms before account creation.

---

### 3.2 Onboarding

#### FR-ONB-001 — First-run onboarding

First-time users shall see a multi-slide onboarding flow covering prompts, AI reflection posture, privacy, and legal clarity.

#### FR-ONB-002 — Completion persistence

Onboarding completion shall persist on-device so completed users are not forced through the flow again.

---

### 3.3 Journaling

#### FR-JRN-001 — Daily prompt

Authenticated users shall receive a daily rotating prompt from the seeded prompt catalog (deterministic rotation). If no prompts exist, the system shall return a free-write fallback prompt.

#### FR-JRN-002 — Create entry

Users shall create journal entries with:

- Body text (1–20,000 characters)
- Optional `promptId`
- Optional `isFreeWrite`
- Optional linked `moodId` owned by the same user

#### FR-JRN-003 — List and open entries

Users shall list their entries (newest first) and open a single entry by id. Users shall only access their own entries.

#### FR-JRN-004 — Update entry

Users shall update entry body / free-write flag. If the body changes, any prior AI reflection shall be cleared until regenerated.

#### FR-JRN-005 — Delete entry

Users shall permanently delete an individual entry they own.

#### FR-JRN-006 — Write UX

The mobile app shall provide write flows for prompt-based writing and free-write, reachable from primary navigation / create affordances.

---

### 3.4 AI reflection

#### FR-AI-001 — Request reflection

Users shall request a reflection for an owned journal entry. The reflection shall be stored on the entry when generated.

#### FR-AI-002 — Non-clinical guardrails

AI system prompts shall instruct the model to:

- Stay warm, non-judgmental, and observational
- Avoid diagnosis, clinical labels, medical advice, and therapy claims
- Respond in short plain text

#### FR-AI-003 — Crisis heuristic

If entry text matches configured crisis patterns (e.g. explicit self-harm / suicide language), the system shall return a fixed safety message with resource guidance and shall **not** call the generative model for that request.

#### FR-AI-004 — Fallback reflection

If OpenAI is unavailable or unset, the system shall return a deterministic supportive fallback reflection.

#### FR-AI-005 — Reflection rate limit

Reflection generation shall be rate-limited per authenticated user (target: 40 / hour).

#### FR-AI-006 — Visible disclaimer

UI surfaces that present AI content shall include or link to the product medical disclaimer stating Journal IQ is not therapy, diagnosis, or medical care.

---

### 3.5 Mood tracking

#### FR-MOOD-001 — Mood scale

Mood check-ins shall use an integer score from **1 to 5**, with default labels:

| Score | Label |
| --- | --- |
| 1 | Low |
| 2 | Uneasy |
| 3 | Okay |
| 4 | Good |
| 5 | Great |

#### FR-MOOD-002 — Create mood

Users shall create a mood with score, optional custom label (≤40 chars), optional note (≤500 chars), and optional `loggedAt` timestamp.

#### FR-MOOD-003 — List moods

Users shall retrieve recent moods (target: last 90).

#### FR-MOOD-004 — Weekly mood stats

Users shall retrieve a 7-day summary including average score, count, and daily averages for charting.

#### FR-MOOD-005 — Mood UI

The mobile app shall provide mood check-in and weekly visualization on dedicated Mood / Insights surfaces.

---

### 3.6 Weekly insights

#### FR-INS-001 — Weekly insight generation

Authenticated users shall request a weekly insight covering approximately the last 7 days of moods and journal activity.

#### FR-INS-002 — Theme extraction

The backend shall extract lightweight writing themes from recent entries to inform the insight summary.

#### FR-INS-003 — Caching

If a recent insight for a comparable period already exists (within ~24 hours), the system shall return the cached insight instead of regenerating.

#### FR-INS-004 — Fallback insight

If OpenAI is unavailable, the system shall compose a deterministic summary from mood averages, journal counts, and themes.

#### FR-INS-005 — Insight rate limit

Weekly insight generation shall be rate-limited per authenticated user (target: 12 / hour).

---

### 3.7 Home, streak, and navigation

#### FR-HOME-001 — Home dashboard

Home shall surface greeting / identity cues, streak information, and entry points to write, mood, or recent activity.

#### FR-HOME-002 — Soft streak

The system shall compute a soft “showed up” streak based on journaling activity days (client utility over entry dates). Streak is motivational, not a gamified competitive ranking.

#### FR-NAV-001 — Primary tabs

Primary authenticated navigation shall include Home, Journal, Create, Mood/Insights-related destinations, and Settings (exact tab labels per current mobile layout).

#### FR-NAV-002 — Notifications inbox

The app shall provide an in-app notifications / inbox surface synchronized with local notification state where applicable.

---

### 3.8 Local reminders

#### FR-REM-001 — Daily reminders

Users shall enable/disable local daily journaling reminders with configurable time presets / custom time.

#### FR-REM-002 — Device-local storage

Reminder preferences and scheduled local notifications shall remain on-device and shall not be required server-side for v1.

#### FR-REM-003 — Permission handling

Enabling reminders shall request OS notification permission and degrade gracefully if denied.

---

### 3.9 App lock (device security)

#### FR-LOCK-001 — Optional lock

Users shall optionally enable an app lock using PIN and/or device biometrics (Face ID / fingerprint where available).

#### FR-LOCK-002 — Local-only secrets

PIN / biometric preferences shall be stored only on the device (e.g. Secure Store). They shall not be uploaded to the Journal IQ API.

#### FR-LOCK-003 — Lock gate

When enabled, the app shall present a lock screen before revealing authenticated content after cold start / background return per client lock policy.

---

### 3.10 Profile and settings

#### FR-PROF-001 — View / update profile

Users shall view and update display name and timezone via `/me`.

#### FR-PROF-002 — Local avatar

Users may set a local profile photo (camera / library). Avatar binary data is device-local for v1.

#### FR-SET-001 — Settings hub

Settings shall expose account actions, legal documents, reminders, app lock, export, delete, and sign-out.

---

### 3.11 Data portability and erasure

#### FR-DATA-001 — Export

Authenticated users shall export account data as JSON including profile, journals (with prompt/mood context), moods, and insights, plus an `exportedAt` timestamp.

#### FR-DATA-002 — Account deletion

Authenticated users shall permanently delete their account. Deletion shall cascade to refresh tokens, password resets, journals, moods, and insights.

---

### 3.12 Legal and compliance surfaces

#### FR-LEG-001 — In-app Privacy Policy

The app shall display a Privacy Policy covering collection, AI processing, retention, export/deletion, children, and contact.

#### FR-LEG-002 — In-app Terms of Service

The app shall display Terms covering acceptable use, AI limitations, non-medical framing, and account responsibilities.

#### FR-LEG-003 — Disclaimer consistency

Product disclaimer copy shall remain consistent across onboarding, AI surfaces, and store listing guidance.

---

## 4. External interface requirements

### 4.1 User interfaces (mobile)

| Screen / flow | Purpose |
| --- | --- |
| Onboarding | First-run value prop + privacy clarity |
| Sign up / Sign in | Account creation and authentication |
| Forgot / Reset password | Account recovery via email deep link |
| Home | Streak, shortcuts, recent context |
| Journal list / entry detail | Browse and open entries |
| Write | Compose prompt or free-write entry |
| Mood | Check-in + weekly chart |
| Insights | Weekly AI insight + summary stats |
| Notifications | In-app inbox |
| Profile | Name / avatar |
| Settings | Preferences, legal, export, delete, lock, reminders |
| App lock | PIN / biometric unlock |
| Privacy / Terms | Full legal documents |
| Not found | Unknown route handling |

**UI constraints**

- Dark brand theme (primary canvas around deep navy; accent greens)
- Portrait-first layout
- Accessible form validation errors on auth and write flows

### 4.2 API interfaces

Base service: Journal IQ API (default local `http://localhost:4000`).

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | Liveness (`ok`, service name) |
| POST | `/auth/signup` | No | Register |
| POST | `/auth/signin` | No | Login |
| POST | `/auth/refresh` | No | Rotate tokens |
| POST | `/auth/forgot-password` | No | Request reset |
| POST | `/auth/reset-password` | No | Confirm reset |
| POST | `/auth/signout` (or revoke) | Yes / token | End session |
| GET | `/prompts/today` | Yes | Daily prompt |
| GET/POST | `/journals` | Yes | List / create |
| GET/PATCH/DELETE | `/journals/:id` | Yes | Read / update / delete |
| POST | `/journals/:id/reflect` | Yes | Generate reflection |
| GET/POST | `/moods` | Yes | List / create |
| GET | `/moods/stats` | Yes | Weekly mood stats |
| GET | `/insights/weekly` | Yes | Weekly insight |
| GET/PATCH/DELETE | `/me` | Yes | Profile / delete account |
| GET | `/me/export` | Yes | JSON export |

Validation for auth, journals, moods, and profile updates shall use shared Zod schemas from `@journal-iq/shared`.

### 4.3 Software interfaces

| System | Interface purpose |
| --- | --- |
| PostgreSQL (Neon) | Persist users, tokens, prompts, journals, moods, insights |
| OpenAI Chat Completions | Generate reflections and weekly insights |
| Nodemailer / Gmail SMTP | Deliver password-reset emails |
| Expo Notifications | Schedule local reminders |
| Expo Local Authentication | Biometric unlock |
| Expo Secure Store | Persist tokens / lock secrets on device |
| Sentry (optional) | Client error monitoring |

### 4.4 Communication interfaces

- JSON over HTTP
- Authorization: `Authorization: Bearer <accessToken>`
- Production transport shall use HTTPS
- Mobile deep link scheme: `journaliq` (password reset host/path)

---

## 5. Non-functional requirements

### 5.1 Security (NFR-SEC)

| ID | Requirement |
| --- | --- |
| NFR-SEC-001 | Passwords shall be stored only as one-way hashes |
| NFR-SEC-002 | Refresh and password-reset tokens shall be stored hashed |
| NFR-SEC-003 | API shall apply Helmet security headers |
| NFR-SEC-004 | CORS shall be restricted via configured client origin(s) |
| NFR-SEC-005 | Auth routes shall be rate-limited; forgot-password more strictly |
| NFR-SEC-006 | AI endpoints shall be rate-limited per user |
| NFR-SEC-007 | Users shall only read/write their own journals, moods, and insights |
| NFR-SEC-008 | App lock secrets remain on-device |
| NFR-SEC-009 | Request JSON body size shall be limited (target: 1 MB) |

### 5.2 Privacy (NFR-PRI)

| ID | Requirement |
| --- | --- |
| NFR-PRI-001 | Journal content shall not be sold |
| NFR-PRI-002 | AI provider shall receive entry/mood context only when the user requests AI features |
| NFR-PRI-003 | Export and deletion shall be available from Settings |
| NFR-PRI-004 | Privacy Policy and Terms shall be accessible without requiring support tickets |
| NFR-PRI-005 | Children under 13 (or regional minimum) are not a target audience |

### 5.3 Reliability and availability (NFR-REL)

| ID | Requirement |
| --- | --- |
| NFR-REL-001 | `/health` shall report service liveness for monitoring |
| NFR-REL-002 | AI failures or missing API keys shall fall back to non-empty supportive text |
| NFR-REL-003 | Missing SMTP shall not crash forgot-password; development logging is acceptable |
| NFR-REL-004 | Weekly insight cache shall reduce duplicate generative calls |

### 5.4 Performance (NFR-PERF)

| ID | Requirement |
| --- | --- |
| NFR-PERF-001 | Auth and CRUD endpoints should typically respond within interactive mobile latency on a healthy network |
| NFR-PERF-002 | Reflection generation may take longer (external model); UI shall show loading state |
| NFR-PERF-003 | Mood list default window capped (≈90) to bound payload size |
| NFR-PERF-004 | Weekly insight uses a bounded recent entry sample (≈14) |

### 5.5 Usability (NFR-USE)

| ID | Requirement |
| --- | --- |
| NFR-USE-001 | Primary journaling actions reachable within one or two taps from Home / Create |
| NFR-USE-002 | Form errors shall be human-readable |
| NFR-USE-003 | Medical disclaimer language shall be plain and visible |
| NFR-USE-004 | Onboarding shall set expectations before first AI use |

### 5.6 Maintainability (NFR-MAIN)

| ID | Requirement |
| --- | --- |
| NFR-MAIN-001 | Shared schemas live in `packages/shared` to avoid client/server drift |
| NFR-MAIN-002 | Database changes shall use Prisma migrations for production paths |
| NFR-MAIN-003 | Environment configuration via `.env` (DATABASE_URL, JWT secrets, optional OpenAI/SMTP) |

### 5.7 Portability (NFR-PORT)

| ID | Requirement |
| --- | --- |
| NFR-PORT-001 | Mobile client targets iOS and Android through Expo |
| NFR-PORT-002 | API is OS-agnostic Node.js service |

### 5.8 Observability (NFR-OBS)

| ID | Requirement |
| --- | --- |
| NFR-OBS-001 | Optional Sentry integration on mobile for crash/error reporting |
| NFR-OBS-002 | API shall log critical auth/email development signals (e.g. reset URL when SMTP unset) |

---

## 6. Data requirements

### 6.1 Logical data model

**User**

- Identity: `id`, `email` (unique), `passwordHash`, `name`, `timezone`, timestamps
- Relations: refresh tokens, password resets, journal entries, mood entries, AI insights

**RefreshToken**

- `tokenHash`, `expiresAt`, optional `revokedAt`

**PasswordReset**

- `tokenHash`, `expiresAt`, optional `usedAt`

**Prompt**

- `text`, `category`, `sortOrder`

**JournalEntry**

- `body`, `isFreeWrite`, optional `promptId`, optional `reflection`, optional linked `moodId`, timestamps

**MoodEntry**

- `score` (1–5), `label`, optional `note`, `loggedAt`

**AiInsight**

- `periodStart`, `periodEnd`, `content`

### 6.2 Integrity rules

- Deleting a user cascades to tokens, journals, moods, and insights
- Journal `moodId` is unique when set (one-to-one link)
- Prompt deletion sets journal `promptId` to null
- Email uniqueness enforced at database level

### 6.3 Data retention

- Account data retained while account is active
- Tokens expire automatically by `expiresAt`
- Account deletion permanently removes related server data
- Server logs may be retained temporarily for security/reliability

### 6.4 Device-local data (not server account records)

- App lock PIN / biometric preference
- Reminder schedule preferences
- Profile photo / avatar file
- Onboarding completion flag
- Securely stored session tokens on device

---

## 7. Constraints, assumptions, and dependencies

### 7.1 Regulatory / policy constraints

- Product must not market itself as therapy, diagnosis, counseling, or medical care
- Store listing and in-app legal copy must disclose AI processing of submitted text
- Crisis-related fixed responses are informational resources only — not emergency services

### 7.2 Technical constraints

- Monorepo npm workspaces (`apps/*`, `packages/*`)
- Backend depends on Prisma + PostgreSQL
- Mobile depends on Expo Router file-based navigation
- OpenAI model currently specified as `gpt-4o-mini` for generative features

### 7.3 Assumptions

- Users can install Expo Go or a built binary matching the project SDK
- Operators will rotate leaked database credentials
- Production deployments will set strong JWT secrets and HTTPS

### 7.4 Future requirements (Could)

| ID | Candidate |
| --- | --- |
| FR-FUT-001 | Cloud sync of reminder preferences |
| FR-FUT-002 | Richer crisis localization beyond IASP link |
| FR-FUT-003 | Multi-language UI and prompts |
| FR-FUT-004 | End-to-end encrypted journal bodies |
| FR-FUT-005 | Subscriptions / premium insight depth |
| FR-FUT-006 | Web client parity |

---

## 8. Appendices

### 8.1 Requirement ID convention

```
FR-<AREA>-NNN   Functional requirement
NFR-<AREA>-NNN  Non-functional requirement
```

Areas: `AUTH`, `ONB`, `JRN`, `AI`, `MOOD`, `INS`, `HOME`, `NAV`, `REM`, `LOCK`, `PROF`, `SET`, `DATA`, `LEG`, `SEC`, `PRI`, `REL`, `PERF`, `USE`, `MAIN`, `PORT`, `OBS`, `FUT`.

### 8.2 Mood label map

Defined in `@journal-iq/shared` as `MOOD_LABELS` (1=Low … 5=Great).

### 8.3 Safety response principle

When crisis heuristics match, Journal IQ prioritizes a fixed supportive message and external resource pointer over generative completion. This response is **not** emergency assistance.

### 8.4 Acceptance checklist (v1.0.0)

- [ ] Sign up, sign in, sign out, forgot/reset password work end-to-end
- [ ] Daily prompt and free-write create persisted entries
- [ ] Reflection generates (or falls back) and respects rate limits / crisis heuristic
- [ ] Moods create and weekly stats render
- [ ] Weekly insights generate or return cache/fallback
- [ ] Streak appears on Home after journaling days
- [ ] Local reminders schedule when permission granted
- [ ] App lock PIN/biometric gates content when enabled
- [ ] Export JSON contains user journals/moods/insights
- [ ] Account delete removes server data and ends session
- [ ] Privacy Policy and Terms readable in-app; signup consent required
- [ ] Medical disclaimer visible on AI-related surfaces

### 8.5 Document revision history

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0.0 | 2026-09-28 | Engineering | Initial SRS derived from implemented Journal IQ monorepo |

---

*End of Software Requirements Specification — Journal IQ*
