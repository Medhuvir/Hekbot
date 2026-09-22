# HekBot — Personal Fitness & Nutrition Dashboard

Built by **DN Creative LLC** · React + Vite + Tailwind + Supabase + Netlify

The app is branded **HekBot** (header, favicon, page title). Internally the
fitness program itself is still called **"Ascension"** in places (progress
card, footer, phase labels) — that's Medhuvir's program name, not the
product name; both are correct and intentional.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Follow **Section 9** of `PROJECT_SPEC.md` for the original beginner
walkthrough, then apply everything in `supabase/migrations/` in order
(002–005) on top of it — those cover HekBot chat, Google Fit tokens, food
presets, and the profile timezone field, none of which were in the original
v1 schema. The short version for an already-provisioned project:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API**, copy your **Project URL** and **anon/public key**
3. Run the schema + RLS SQL from `PROJECT_SPEC.md` Section 9, then run every file in `supabase/migrations/` in numeric order
4. Create your user in **Authentication → Users** (this is also the only signed-in user — the app is single-tenant, not multi-user)

### 3. Configure environment variables

```bash
cp .env.example .env
# Then edit .env and paste your Supabase URL and anon key
```

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

⚠️ Never put the service_role key here — it bypasses all security. It only
ever lives as a Supabase Edge Function secret.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the public dashboard.
Open [http://localhost:5173/app](http://localhost:5173/app) for the full signed-in experience.

Note: local dev and production point at the **same live Supabase project** —
there's no separate local database. Anything written while testing locally
(including HekBot chat test messages) lands in the real data.

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Read-only, shareable dashboard — charts, logs, progress, day navigation. No HekBot, no edit controls. |
| `/app` | Supabase Auth required | Full experience — HekBot chat/logging + manual edit tools |
| `/login` | Public | Login page — redirects to `/app` on success |

`/admin` and `/admin/login` were retired (this used to be an admin-vs-public
split) and now fall through to `/`.

---

## HekBot — the AI coach

`src/components/hekbot/HekbotPanel.jsx`, only rendered at `/app`. A chat
surface that:

- Extracts food/workout/weight entries from free-text or photo, shows a
  review card, and only writes to the DB once the user confirms (`chat` →
  preview only; `log-commit` → the actual write, called separately on confirm)
- Greets with a time-of-day-aware prompt ("What's for breakfast/lunch/
  dinner?" / a late-night-snack joke after 10pm) and an animated rotating
  placeholder in the input
- Expands on focus, collapses on blur/click-outside/X, Enter to send,
  Shift+Enter for a newline
- Both `chat` and `log-commit` Edge Functions require a real authenticated
  session (checked via a bearer token → `auth.getUser()`) — the public anon
  key alone is rejected. The client sends the signed-in user's live session
  token, never a static key.

---

## Timezone & "today"

This was a real bug this project hit: computing "today" via
`new Date().toISOString().split('T')[0]` reads the **UTC** date, which
drifts from the user's actual local date for part of every day. Fixed by:

- `profiles.timezone` (migration 005, default `'America/New_York'`) — a real,
  user-editable field, not inferred from the browser. Editable from the
  Profile card when signed in.
- `lib/helpers.js#todayInTZ(timeZone)` resolves "today" via
  `Intl.DateTimeFormat('en-CA', { timeZone })` — the canonical source
  everywhere a date is needed (dashboard, HekBot's `logDate`, the chat
  Edge Function's coaching context).
- `hooks/useLiveToday.js` re-resolves on a 30s poll **and** on
  `visibilitychange`/`focus` — a plain interval alone isn't reliable since
  browsers throttle timers in backgrounded tabs; a tab left open overnight
  needs to catch up the moment it's looked at again, not wait on the poll.
- The `chat` Edge Function treats `profiles.timezone` as authoritative
  (fetched first, before anything that depends on it), falling back to a
  client-sent date and then a UTC guess only if the profile has none.

## Day navigation

The dashboard's daily view (`pages/Dashboard.jsx`) isn't locked to today —
prev/next-day chevrons and a native date-picker (in `Header.jsx`) let you
browse any past day, clamped so you can't go into the future. Browsing a
past day doesn't affect the weekly trend charts, which always trail the
real live "today" independent of whatever day is being viewed.

---

## Secondary brand — Order of Fire

DN Creative is the primary design system (colors, type, component
patterns — see Section 8 below). Medhuvir's separate personal brand,
**Order of Fire** (source: `github.com/Medhuvir/Orderoffire`), is layered in
as a secondary artifact where it's contextually relevant — currently just
the official medallion mark (`src/components/OrderOfFireMedallion.jsx`)
next to the "Order of Fire" affiliation label in the Profile card and
public hero. Not a restyle of the app — DN Creative fonts, colors, and
layout patterns are untouched.

---

## Deploying to Netlify

1. Push this repo to GitHub
2. In Netlify: **Add new site → Import an existing project → GitHub**
3. Select your repo
4. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Go to **Site settings → Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Trigger a deploy

The `netlify.toml` redirect rule ensures React Router works for all routes
including `/app`.

**Deploys are manual, on request** — commits get made locally as work
happens, but `git push origin main` (which triggers the Netlify build) and
Supabase Edge Function deploys only happen when explicitly asked for in the
moment. A local commit existing doesn't mean it's live; check
`git status -sb` (ahead-of-origin count) and `git log origin/main..HEAD` to
see what's committed but not yet pushed.

---

## Architecture

```
src/
├── supabaseClient.js      # Supabase client (anon key — safe for client)
├── lib/
│   ├── queries.js         # All Supabase read operations
│   ├── mutations.js       # All Supabase write operations (authenticated only)
│   └── helpers.js         # Date utils (today/timezone-aware), macro math, progress calc
├── hooks/
│   ├── useLiveToday.js    # Timezone-aware "today", resyncs on focus/visibility
│   └── ...                # useFoodLogs, useWorkoutLogs, useCheckins, useTargets, useProfile, useAuth
├── components/
│   ├── DNMark.jsx              # DN Creative logo mark SVG
│   ├── OrderOfFireMedallion.jsx # Order of Fire medallion (secondary brand)
│   ├── TopoBackground.jsx      # Brand topographic texture
│   ├── HeroImageBackdrop.jsx   # Page-top photo backdrop
│   ├── hekbot/                 # HekbotPanel (chat), HekbotReview (confirm card)
│   ├── layout/                 # Header (date nav lives here), PageWrapper, SectionLabel
│   ├── charts/                 # WeightTrend, MacroAdherence, CalorieTrend, JourneyProgress
│   ├── tracker/                # DailyIntakePanel, WorkoutLogPanel, MacroTotalsBar
│   ├── profile/                 # ProfilePanel, PublicProfileHero
│   ├── checkin/                # WeeklySummary
│   └── admin/                  # ImportModal (MyFitnessPal CSV import)
├── pages/
│   ├── Dashboard.jsx      # / and /app routes — mode="public" | "app"
│   └── Login.jsx          # /login
└── guards/
    └── AuthGuard.jsx       # Redirects unauthenticated users to /login

supabase/
├── functions/
│   ├── chat/               # HekBot chat + extraction (preview only, no writes)
│   ├── log-commit/         # Commits a confirmed extraction/preset to the DB
│   ├── google-auth-start/  # Google Fit OAuth
│   └── google-auth-callback/
└── migrations/              # 002–005, additive on top of the original v1 schema
```

Each Edge Function is a single self-contained file — the deploy tool used
here doesn't resolve `../_shared/` imports across function folders, so
`chat` and `log-commit` each inline their own copies of small shared logic
(the auth check, the DB-write helpers) rather than importing from a shared
module.

### Security model

- The Supabase `anon` key is in client code — **this is safe by design**
  when Row Level Security (RLS) is configured correctly.
- RLS policies ensure the anon key can only SELECT, never
  INSERT/UPDATE/DELETE, on any table. `conversations` and `google_tokens`
  have no anon/authenticated policies at all — service-role (Edge Function)
  only.
- After login, Supabase Auth returns a JWT. The Supabase JS client
  automatically attaches this token to API calls, switching the role from
  `anon` to `authenticated` — unlocking write policies for direct table
  access.
- The `chat` and `log-commit` Edge Functions write via the service-role key
  (bypassing RLS), so they additionally verify the caller's bearer token
  resolves to a real authenticated user before doing anything — the anon
  key alone gets a 401. The client always sends the signed-in user's live
  session token, never the static anon key, when calling these.
- The service_role key is never exposed to the client; it only exists as an
  Edge Function secret.

---

## Design System

DN Creative brand system (primary) — Pitch Black `#0A0A0A`, Warm White
`#F5F3EE`, Blaze Orange `#FF5E1A`. Fonts: Bebas Neue (display) + DM Sans
(body) via Google Fonts. Full original spec in `PROJECT_SPEC.md → Section 8`,
with two corrections since it was written:

- **Secondary text color**: `text-dn-graphite` (`#6B6B6B`) was swept to
  `text-dn-gray-light` (`#C8C6C0`) across the app — graphite-on-black only
  hits ~3.65:1 contrast (fails WCAG AA); gray-light hits ~11.6:1.
  `dn-graphite` still exists in the palette but is reserved for
  disabled/tertiary, not body/label text.
- **Header lockup**: no longer the "DN Creative / Design Studio" wordmark —
  simplified to `DN mark | HEKBOT`.

Order of Fire (secondary) — see above.

---

## Future Phases (not in v1)

- Apple Health / HealthKit sync
- Barcode scanner for food
- Progress photo gallery
- Retatrutide dosing log
- AI meal planning suggestions

See `PROJECT_SPEC.md → Section 11` for the full roadmap.

---

## Session changelog

Recent major work, roughly chronological, for continuity across chats:

- **Hero/header polish** — fixed a stacking-context bug hiding the topo
  banner backdrop; readability sweep (graphite→gray-light, bumped smallest
  font sizes); Weekly Training grid wired to real workout logs instead of
  hardcoded data; DN-mark favicon; header simplified to `DN | HEKBOT`.
- **HekBot UX** — time-of-day greeting, slow-pulsing status dot,
  expand/collapse-on-focus input with Enter/Shift+Enter, glowing submit
  button, animated rotating placeholder, orange secondary-CTA suggestion
  chips, X-to-close/reset on the active chat.
- **Scope change: public dashboard + login gate** — consolidated the old
  `PublicDashboard.jsx`/`AdminDashboard.jsx`/`AdminLogin.jsx` into
  `Dashboard.jsx` (mode-parameterized) + `Login.jsx`; `/` is now the
  public read-only share link, `/app` is the full signed-in experience
  (HekBot + edit tools merged in, replacing `/admin`); RLS audited (was
  already correct); `chat`/`log-commit` locked down to require real
  authenticated sessions (previously the anon key alone was enough to
  invoke them).
- **Day navigation + timezone fix** — see sections above. Included deleting
  13 rows of test-contaminated data (mis-dated by the pre-fix UTC bug)
  from `food_logs`/`workout_logs` that were left over from verifying the
  chat flow during this work.
- **Profile** — added `profiles.timezone` (user-editable), real avatar
  photo (top-aligned crop, not centered — several candidates were
  full-body shots), Order of Fire medallion next to the affiliation label.
- **Public hero redesign** — replaced the "Phase I — Break 200" label with
  a single-row (desktop) stat strip: Goal / Training Block / Priorities,
  each with an icon.

Everything above is deployed live as of the last explicit "push live"
request in this project's history. Edge Function and Netlify deploys are
never automatic — see *Deploying to Netlify* above.

---

*HekBot · DN Creative LLC · 2026*
