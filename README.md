# Ascension — Personal Fitness & Nutrition Dashboard

Built by **DN Creative LLC** · React + Vite + Tailwind + Supabase + Netlify

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Follow **Section 9** of `PROJECT_SPEC.md` for the full beginner walkthrough.  
The short version:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API**, copy your **Project URL** and **anon/public key**
3. Paste the schema SQL from Section 9-C into the Supabase SQL Editor and Run
4. Paste the RLS SQL from Section 9-D into the SQL Editor and Run
5. Create your admin user in **Authentication → Users**

### 3. Configure environment variables

```bash
cp .env.example .env
# Then edit .env and paste your Supabase URL and anon key
```

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

⚠️ Never put the service_role key here — it bypasses all security.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the public dashboard.  
Open [http://localhost:5173/admin](http://localhost:5173/admin) for the admin portal.

---

## Two Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Read-only dashboard — charts, logs, progress |
| `/admin` | Supabase Auth required | Full edit access — log food, workouts, check-ins |
| `/admin/login` | Public | Login page — redirects to `/admin` on success |

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

The `netlify.toml` redirect rule ensures React Router works for all routes including `/admin`.

---

## Architecture

```
src/
├── supabaseClient.js      # Supabase client (anon key — safe for client)
├── lib/
│   ├── queries.js         # All Supabase read operations
│   ├── mutations.js       # All Supabase write operations (admin only)
│   └── helpers.js         # Date utils, macro math, progress calc
├── hooks/                 # React hooks wrapping queries
├── components/
│   ├── DNMark.jsx         # DN Creative logo mark SVG
│   ├── TopoBackground.jsx # Brand topographic texture
│   ├── layout/            # Header, PageWrapper, SectionLabel
│   ├── charts/            # WeightTrend, MacroAdherence, CalorieTrend, JourneyProgress
│   ├── tracker/           # DailyIntakePanel, WorkoutLogPanel, MacroTotalsBar
│   ├── profile/           # ProfilePanel
│   └── checkin/           # WeeklySummary (with CheckinForm for admin)
├── pages/
│   ├── PublicDashboard.jsx  # / route — isAdmin=false throughout
│   ├── AdminDashboard.jsx   # /admin route — isAdmin=true throughout
│   └── AdminLogin.jsx       # /admin/login
└── guards/
    └── AuthGuard.jsx        # Redirects unauthenticated users to login
```

### Security model

- The Supabase `anon` key is in client code — **this is safe by design** when Row Level Security (RLS) is configured correctly.
- RLS policies (set up in Section 9-D) ensure the anon key can only SELECT, never INSERT/UPDATE/DELETE.
- After admin login, Supabase Auth returns a JWT. The Supabase JS client automatically attaches this token to API calls, switching the role from `anon` to `authenticated` — unlocking write policies.
- The service_role key is never used in this app.

---

## Design System

DN Creative brand system — Pitch Black `#0A0A0A`, Warm White `#F5F3EE`, Blaze Orange `#FF5E1A`.  
Fonts: Bebas Neue (display) + DM Sans (body) via Google Fonts.  
See `PROJECT_SPEC.md → Section 8` for the full design spec.

---

## Future Phases (not in v1)

- Apple Health / HealthKit sync
- Barcode scanner for food
- Progress photo gallery
- Retatrutide dosing log
- AI meal planning suggestions

See `PROJECT_SPEC.md → Section 11` for the full roadmap.

---

*Ascension · DN Creative LLC · 2026*
