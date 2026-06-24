# PROJECT_SPEC.md — Ascension Fitness Dashboard
### Personal Nutrition & Training Tracker for Meddhuvir
**Version:** 1.0 · June 2026  
**Built by:** DN Creative LLC  
**Stack:** React (Vite) + Tailwind · Supabase (Postgres + Auth) · Netlify · GitHub

---

## Table of Contents

1. [User Profile](#1-user-profile)
2. [Goals & Milestones](#2-goals--milestones)
3. [Daily Nutrition Targets](#3-daily-nutrition-targets)
4. [App Architecture — Two Views](#4-app-architecture--two-views)
5. [Core Features](#5-core-features)
6. [Data Model](#6-data-model)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
8. [Design System](#8-design-system)
9. [Supabase Setup Guide (Beginner)](#9-supabase-setup-guide-beginner)
10. [Scaffold Order & Build Plan](#10-scaffold-order--build-plan)
11. [Future Phases (Out of Scope for v1)](#11-future-phases-out-of-scope-for-v1)

---

## 1. User Profile

| Field | Value |
|---|---|
| **Name** | Meddhuvir |
| **Age** | 43 |
| **Height** | 5'10" (178 cm) |
| **Starting Weight** | 211 lbs (95.7 kg) |
| **Occupation** | Tech professional + consulting business owner, father |
| **Affiliation** | Order of Fire |
| **Training Split** | 3× Resistance Training + 3× Martial Arts per week |
| **Supplement Context** | Retatrutide (Reta) — GLP-1 class, supporting fat loss |
| **Avatar** | User-uploadable image (placeholder shown until uploaded) |

### Training Schedule (weekly template)

| Day | Activity |
|---|---|
| Monday | Resistance Training |
| Tuesday | Martial Arts |
| Wednesday | Resistance Training |
| Thursday | Martial Arts |
| Friday | Resistance Training |
| Saturday | Martial Arts |
| Sunday | Rest / Active Recovery |

*This template is editable in the Admin portal. The schedule shown above is the starting default.*

---

## 2. Goals & Milestones

### Narrative Framing: "Ascension"

Progress is framed as a journey — not just a number dropping. Language throughout the app uses words like *level*, *threshold*, *progress*, *forge*, consistent with the Order of Fire identity. The dashboard is a training log and a motivational artifact.

### Weight Milestones

| Milestone | Target | Timeframe |
|---|---|---|
| **Phase I — Break 200** | < 200 lbs (90.7 kg) | 8 weeks (by ~Aug 18, 2026) |
| **Phase II — Strike 190** | 190 lbs (86.2 kg) | 16 weeks (by ~Oct 13, 2026) |

### Performance Goals

- Maintain training output (strength, technique, endurance) throughout both phases
- Sustain protein at 180g/day to preserve lean mass during cut
- Weekly check-ins must show stable or improving energy and recovery
- No sacrifice of performance metrics for scale speed

---

## 3. Daily Nutrition Targets

| Macro | Target | Notes |
|---|---|---|
| **Calories** | 2,250 kcal | ±150 kcal flex range (2,100–2,400 is acceptable) |
| **Protein** | 180g | Fixed. Non-negotiable. Prioritized above all other macros. |
| **Carbohydrates** | 200–230g | Range, not a hard target |
| **Fat** | 55–70g | Range, not a hard target |

### Tracking Logic

- "On Track" = within target ranges
- "Under" = calories below 2,100 or protein below 160g (warning state)
- "Over" = calories above 2,400 (warning state); protein over is never penalized
- Net calories = daily intake calories − estimated workout calories burned

*Targets are stored in the database (not hardcoded) so they can be updated over time without a code deployment.*

---

## 4. App Architecture — Two Views

### Route Map

```
/           → Public Dashboard (read-only)
/admin      → Admin Portal (Supabase Auth required)
/admin/login → Login page (redirects to /admin on success)
```

### 4a. Admin Portal (`/admin`)

**Access:** Supabase email/password authentication. No content renders until authenticated. Unauthorized visits redirect to `/admin/login`.

**Capabilities:**
- Add, edit, delete food log entries
- Add, edit, delete workout log entries
- Enter weekly check-in data (weight, waist)
- Edit user profile details and training schedule
- Edit nutrition targets (calories, macros)
- View all charts and data (same as public view)

**Security:**
- Uses Supabase session token (JWT) for API calls
- Session stored in memory / localStorage, cleared on sign-out
- Service role key is NEVER exposed in client-side code

### 4b. Public Dashboard (`/` root)

**Access:** No login. Publicly accessible URL.

**Capabilities:**
- View all charts, trends, and weekly summaries
- View current daily intake and today's totals (read-only)
- View user profile panel
- View progress toward milestones
- Zero input controls — no forms, no add/edit/delete buttons

**Security:**
- Uses Supabase anon (public) key only
- Supabase RLS policies enforce read-only access for the anon role
- Write endpoints are never called or exposed in this route's code bundle
- A visitor cannot write data even with developer tools

### Shared Components

Both views render the same chart components, card components, and data panels. The difference is controlled by an `isAdmin` boolean passed at the routing level: when `true`, edit controls render; when `false`, they are omitted from the DOM entirely (not just hidden).

---

## 5. Core Features

### 5.1 Daily Intake Tracker

**Public view:** Shows today's logged food items and running macro totals vs targets. Read-only.

**Admin additions:**
- Quick-add form: food name, calories, protein (g), carbs (g), fat (g)
- Edit inline or via modal
- Delete entry
- Bulk import from text (future phase — not v1)

**UI elements:**
- Food log list (name, cals, P/C/F macros)
- Running total row with color indicators:
  - Green = within target range
  - Amber = under target (protein warning)
  - Red = over target (calories exceeded)
- Progress bars for each macro (0% → 100% of target)
- Net calorie calculation displayed below totals

---

### 5.2 Energy Output Tracker (Manual, v1 only)

**Note:** Apple Health / Fitness integration is explicitly out of scope for v1. All calorie burn data is entered manually by the admin.

**Admin entry:** Workout log form with:
- Workout type (preset select): `Resistance Training` | `Martial Arts` | `Other`
- Custom name/notes (optional text)
- Duration (minutes)
- Estimated calories burned (entered manually — no formula applied)
- Date (defaults to today)

**Public view:** Shows today's and historical workout entries. Read-only.

**Calculated values (displayed in both views):**
- Today's calorie intake
- Today's estimated calorie burn
- Today's net calories = intake − output
- Weekly average net calories

---

### 5.3 User Profile Panel

Displayed in both views. Editable only in Admin.

**Fields:**
- Avatar image (upload in Admin; placeholder shown until set)
- Name: Meddhuvir
- Age, height, starting weight, current weight (pulled from latest check-in)
- Affiliation: Order of Fire
- Goals summary (Phase I and Phase II targets)
- Training schedule grid (weekly template, read-only display)
- Retatrutide dosing notes (private field — Admin view only, not shown on public dashboard)

---

### 5.4 Progress Visualization

Four chart types, rendered in both views via shared components (Recharts library):

#### Weight Trend Line Chart
- X-axis: dates (weekly check-in dates)
- Y-axis: weight in lbs
- Elements:
  - Line: actual weight measurements
  - Reference line: starting weight (211 lbs)
  - Reference line: Phase I goal (200 lbs) — labeled "Break 200"
  - Reference line: Phase II goal (190 lbs) — labeled "Strike 190"
  - Shaded zone: target range at 8 weeks
  - Projected trend line (simple linear extrapolation from last 3 data points)

#### Macro Adherence Chart
- Bar chart — one bar group per day (last 7 days default, toggleable to 30 days)
- Bars: Protein (g), Carbs (g), Fat (g)
- Reference lines for each macro target
- Color coding: on-target = green; below = amber; over = red (only for calories)

#### Calorie Trend Chart
- Line chart showing last 14 days
- Three lines: Daily intake, Daily burn, Net calories
- Shaded band showing the target calorie zone (2,100–2,400)

#### Waist Measurement Trend
- Simple line chart, weekly data points
- Y-axis: waist in cm
- No target line (directional — lower is better, no hard goal set)

#### Journey Progress Indicator
- A single "% to Phase I" progress bar, displayed prominently
- Calculated as: `(211 - currentWeight) / (211 - 200) × 100`
- Switches to "% to Phase II" once Phase I is complete
- Displayed with the "Ascension" narrative label (e.g., "52% to Break 200")

---

### 5.5 Weekly Check-in View

**Admin entry (once per week, Monday morning — fasted):**
- Date (auto-populated, editable)
- Fasted morning weight (lbs and kg — enter either, auto-converts)
- Waist measurement (cm)
- Optional notes

**Auto-generated weekly summary (shown in both views):**
- Average daily calories for the week
- Protein adherence % (days at or above 180g / 7 days)
- Weight delta vs prior week (e.g., "−1.4 lbs")
- Waist delta vs prior week
- Trend assessment: On Track / Ahead / Needs Adjustment (simple rule-based logic)

---

## 6. Data Model

All tables live in Supabase (PostgreSQL). Schema below.

### `profiles` — One row (the user)

```sql
CREATE TABLE profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Meddhuvir',
  age           integer,
  height_cm     numeric(5,1),
  start_weight_lbs numeric(5,1),
  affiliation   text,
  avatar_url    text,           -- Supabase Storage URL
  training_notes text,
  reta_notes    text,           -- Admin-only field (private)
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

### `targets` — Current nutrition targets (one active row)

```sql
CREATE TABLE targets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calories      integer NOT NULL DEFAULT 2250,
  calories_min  integer NOT NULL DEFAULT 2100,
  calories_max  integer NOT NULL DEFAULT 2400,
  protein_g     integer NOT NULL DEFAULT 180,
  carbs_min_g   integer NOT NULL DEFAULT 200,
  carbs_max_g   integer NOT NULL DEFAULT 230,
  fat_min_g     integer NOT NULL DEFAULT 55,
  fat_max_g     integer NOT NULL DEFAULT 70,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_at    timestamptz DEFAULT now()
);
```

### `food_logs` — Daily food entries

```sql
CREATE TABLE food_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date      date NOT NULL DEFAULT CURRENT_DATE,
  food_name     text NOT NULL,
  calories      integer NOT NULL DEFAULT 0,
  protein_g     numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g       numeric(6,1) NOT NULL DEFAULT 0,
  fat_g         numeric(6,1) NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_food_logs_date ON food_logs(log_date);
```

### `workout_logs` — Manual workout entries

```sql
CREATE TABLE workout_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date        date NOT NULL DEFAULT CURRENT_DATE,
  workout_type    text NOT NULL,   -- 'Resistance Training' | 'Martial Arts' | 'Other'
  workout_name    text,            -- Optional custom label
  duration_min    integer,         -- Duration in minutes
  calories_burned integer,         -- Manually entered estimate
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_workout_logs_date ON workout_logs(log_date);
```

### `weekly_checkins` — Monday morning weigh-in records

```sql
CREATE TABLE weekly_checkins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_date  date NOT NULL UNIQUE,
  weight_lbs    numeric(5,1) NOT NULL,
  weight_kg     numeric(5,2) GENERATED ALWAYS AS (weight_lbs / 2.20462) STORED,
  waist_cm      numeric(5,1),
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_checkins_date ON weekly_checkins(checkin_date);
```

### Computed / Derived Values (not stored, calculated client-side)

- Daily macro totals: `SUM` over `food_logs` by `log_date`
- Daily calorie burn: `SUM(calories_burned)` over `workout_logs` by `log_date`
- Net calories: `intake − burn`
- Weekly summary: aggregate over 7-day window
- Progress %: formula applied to latest check-in weight

---

## 7. Infrastructure & Deployment

### Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React 18 + Vite | Fast dev server, optimized builds |
| Styling | Tailwind CSS v3 | Utility-first, responsive |
| Charts | Recharts | React-native chart library, composable |
| Database | Supabase (PostgreSQL) | Managed Postgres with built-in Auth and RLS |
| Auth | Supabase Auth | Email/password for Admin only |
| Hosting | Netlify | Auto-deploy on GitHub push |
| Source control | GitHub | Main branch → Netlify production |

### Environment Variables

The following environment variables must be set in both local `.env` and Netlify dashboard:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**What these are:**
- `VITE_SUPABASE_URL` — The unique URL for your Supabase project. Safe to expose in the client because Supabase RLS controls what data the key can access.
- `VITE_SUPABASE_ANON_KEY` — The public/anonymous key. Used by both the public and admin routes. Row Level Security (RLS) policies are what control permissions, not key secrecy.
- **Service Role Key — NEVER put in client code.** This key bypasses RLS and is only for server-side scripts.

### Repository Structure

```
hekbot/
├── .env                        # Local env vars (git-ignored)
├── .env.example                # Template — committed to repo
├── .gitignore
├── README.md
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── netlify.toml                # Build settings for Netlify
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx                # App entry point
    ├── App.jsx                 # Router setup
    ├── supabaseClient.js       # Supabase client init
    ├── lib/
    │   ├── queries.js          # All Supabase read queries
    │   ├── mutations.js        # All Supabase write queries (Admin only)
    │   └── helpers.js          # Date utils, unit conversion, etc.
    ├── hooks/
    │   ├── useAuth.js          # Auth state hook
    │   ├── useFoodLogs.js      # Food log data hook
    │   ├── useWorkoutLogs.js   # Workout log data hook
    │   ├── useCheckins.js      # Weekly check-in data hook
    │   ├── useTargets.js       # Nutrition targets hook
    │   └── useProfile.js       # User profile hook
    ├── components/
    │   ├── layout/
    │   │   ├── Header.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── PageWrapper.jsx
    │   ├── charts/
    │   │   ├── WeightTrendChart.jsx
    │   │   ├── MacroAdherenceChart.jsx
    │   │   ├── CalorieTrendChart.jsx
    │   │   ├── WaistTrendChart.jsx
    │   │   └── JourneyProgress.jsx
    │   ├── tracker/
    │   │   ├── DailyIntakePanel.jsx
    │   │   ├── FoodLogItem.jsx
    │   │   ├── MacroTotalsBar.jsx
    │   │   ├── WorkoutLogPanel.jsx
    │   │   └── NetCalorieDisplay.jsx
    │   ├── profile/
    │   │   ├── ProfilePanel.jsx
    │   │   └── GoalsSummary.jsx
    │   ├── checkin/
    │   │   ├── WeeklyCheckinCard.jsx
    │   │   └── WeeklySummary.jsx
    │   └── admin/
    │       ├── FoodLogForm.jsx
    │       ├── WorkoutLogForm.jsx
    │       ├── CheckinForm.jsx
    │       └── TargetsEditor.jsx
    ├── pages/
    │   ├── PublicDashboard.jsx      # Route: /
    │   ├── AdminDashboard.jsx       # Route: /admin
    │   └── AdminLogin.jsx           # Route: /admin/login
    └── guards/
        └── AuthGuard.jsx            # Redirects unauthenticated users
```

### Netlify Configuration

`netlify.toml` (in repo root):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The redirect rule is critical — it tells Netlify to serve the React app for all routes (including `/admin`), so React Router can handle the routing client-side.

---

## 8. Design System

**This is a DN Creative project.** The full DN Creative Brand Design System v1.0 applies.  
Source: `DN-Creative-Brand-Design-System.md` · Brand assets: `Logo/SVG/Black.svg`, `Logo/SVG/White.svg`

### DN Creative Color Palette

| Token | Hex | Tailwind Class | Use in App |
|---|---|---|---|
| **Pitch Black** | `#0A0A0A` | `bg-dn-black` | Primary background |
| **Warm White** | `#F5F3EE` | `text-dn-white` | Primary text on dark |
| **Blaze Orange** | `#FF5E1A` | `text-dn-orange` | Accent, CTAs, active states, progress |
| **Orange Dark** | `#CC4C16` | `text-dn-orange-dark` | Hover states |
| **Surface Dark** | `#1E1E1E` | `bg-dn-surface` | Cards, panels |
| **Surface Darker** | `#141414` | `bg-dn-surface-dark` | Section backgrounds |
| **Graphite** | `#6B6B6B` | `text-dn-graphite` | Secondary text, labels |
| **Gray Light** | `#C8C6C0` | `text-dn-gray-light` | Dividers on light bg |
| **Gray Mid** | `#383838` | `bg-dn-gray-mid` | Dividers on dark bg |

**Functional status colors (not brand colors — used only for data states):**
- On-track: `#22C55E` (green-500)
- Under target / warning: `#F59E0B` (amber-500)
- Over target / danger: `#EF4444` (red-500)

**The 80/20 rule:** Black and White carry 80% of every surface. Orange is the signal.

### Typography

| Role | Family | Source |
|---|---|---|
| **Display / Section headers / Big numbers** | Bebas Neue | Google Fonts |
| **Body / UI / Labels / Everything else** | DM Sans | Google Fonts |

```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap" rel="stylesheet">
```

Tailwind config: `font-display` = Bebas Neue, `font-sans` = DM Sans (default).  
Never use Inter, Roboto, Arial, or system fonts for any branded surface.

### Logo Usage in App

- **Header (dark bg):** Lockup 1 — White mark + divider + "DN Creative" wordmark + "Design Studio" subtitle
- **Mobile header:** Lockup 3 — White mark only (min 24px height)
- **Mark path SVG:** Embedded inline (no external file fetch at runtime)

### Component Patterns (DN Brand-Compliant)

- **Cards:** `bg-dn-surface border border-white/[0.08] rounded-[2px]` — architectural near-square radius
- **Card hover:** Orange top-border reveal via `::before` pseudo-element, `scaleX(0 → 1)` on hover
- **Borders:** `0.5px` throughout — never 1px or 2px (exception: orange hover accent = 2px)
- **Section labels:** DM Sans 10px, uppercase, #6B6B6B, with full-width 0.5px line extending right
- **Topo texture:** Orange SVG paths at 8–10% opacity on dark surfaces (hero, header, chart bg)
- **Progress bars:** 4–6px height, color-coded to status, orange for primary progress
- **Buttons (Admin only):**
  - Primary: `bg-dn-orange text-black font-sans font-semibold` + translateY(-1px) on hover
  - Destructive: `text-red-400 hover:bg-red-400/10`
  - Ghost: `text-white/50 hover:text-white/100`
- **Easing standard:** `cubic-bezier(0.16, 1, 0.3, 1)` — all transitions
- **Stagger reveals:** `.d1` through `.d6` delay classes (0.05s increments)

### Charts (Recharts)

- Background: transparent (inherits card surface)
- Grid lines: `rgba(245,243,238,0.04)` — extremely subtle
- Axis text: `#6B6B6B` (Graphite), DM Sans 10px
- Primary data lines/bars: `#FF5E1A` (Blaze Orange)
- Reference lines (start/goal): `rgba(245,243,238,0.25)`
- Custom tooltip: dark surface `#1E1E1E`, orange border, DM Sans

### Layout

- Max content width: 1280px, centered, `px-6` horizontal padding
- Mobile-first, responsive grid
- Default view: Daily (today's data)
- Toggle: Weekly / Historical
- Top nav on desktop, sticky bottom bar on mobile

---

## 9. Supabase Setup Guide (Beginner)

> This section is your step-by-step guide. Complete each phase before moving to the next. Each step explains *what* you're doing and *why*.

### Phase A — Create Your Supabase Account & Project

**Step A1 — Create a free account**
1. Go to [supabase.com](https://supabase.com) and click **Start your project**
2. Sign up with GitHub (recommended — fastest) or email
3. Once signed in, you'll land on the Supabase dashboard

**Step A2 — Create a new project**
1. Click **New Project**
2. Choose or create an Organization (your personal one is fine)
3. Fill in:
   - **Name:** `hekbot` (or any name you like — this is internal)
   - **Database Password:** Create a strong password and save it somewhere safe (you'll need it if you ever connect directly to Postgres)
   - **Region:** Choose the closest to you (e.g., `US East (N. Virginia)`)
4. Click **Create new project**
5. Wait 1–2 minutes while Supabase provisions your database

> **What just happened:** Supabase created a managed PostgreSQL database for you, plus a REST API, authentication service, and storage bucket — all configured automatically. You didn't write any server code.

---

### Phase B — Find Your API Keys

**Step B1 — Open Project Settings**
1. In your project, click **Settings** (gear icon) in the left sidebar
2. Click **API**

You'll see:

| Key | Name | What it does |
|---|---|---|
| **Project URL** | `https://xxxx.supabase.co` | The base address of your project's API |
| **anon / public** | Long JWT string | Safe to use in client code. Can only do what RLS policies allow. |
| **service_role** | Long JWT string | BYPASSES all security. Server-only. Never put this in client code. |

> **Why this matters:** The `anon` key is like a guest pass — Supabase's Row Level Security (RLS) policies determine what a guest can do (in our case: read only). The `service_role` key is a master key — it ignores all security rules, so it must stay on a server or in a migration script, never in your React app.

**Step B2 — Save your keys**
Copy the **Project URL** and **anon/public key** — you'll paste these into your `.env` file when we set up the app.

---

### Phase C — Create Database Tables

**Step C1 — Open the SQL Editor**
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**

**Step C2 — Paste and run the schema SQL**

Copy the entire block below and paste it into the SQL editor, then click **Run** (or press Cmd/Ctrl+Enter):

```sql
-- ============================================
-- HEKBOT: Fitness Tracker Schema
-- Run this once in Supabase SQL Editor
-- ============================================

-- User profile (single row for this app)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Meddhuvir',
  age           integer DEFAULT 43,
  height_cm     numeric(5,1) DEFAULT 178.0,
  start_weight_lbs numeric(5,1) DEFAULT 211.0,
  affiliation   text DEFAULT 'Order of Fire',
  avatar_url    text,
  training_notes text,
  reta_notes    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Nutrition targets (insert one row to start)
CREATE TABLE IF NOT EXISTS targets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calories      integer NOT NULL DEFAULT 2250,
  calories_min  integer NOT NULL DEFAULT 2100,
  calories_max  integer NOT NULL DEFAULT 2400,
  protein_g     integer NOT NULL DEFAULT 180,
  carbs_min_g   integer NOT NULL DEFAULT 200,
  carbs_max_g   integer NOT NULL DEFAULT 230,
  fat_min_g     integer NOT NULL DEFAULT 55,
  fat_max_g     integer NOT NULL DEFAULT 70,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- Food log entries (one row per food item per day)
CREATE TABLE IF NOT EXISTS food_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date      date NOT NULL DEFAULT CURRENT_DATE,
  food_name     text NOT NULL,
  calories      integer NOT NULL DEFAULT 0,
  protein_g     numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g       numeric(6,1) NOT NULL DEFAULT 0,
  fat_g         numeric(6,1) NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_logs_date ON food_logs(log_date);

-- Workout log entries
CREATE TABLE IF NOT EXISTS workout_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date        date NOT NULL DEFAULT CURRENT_DATE,
  workout_type    text NOT NULL DEFAULT 'Other',
  workout_name    text,
  duration_min    integer,
  calories_burned integer,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(log_date);

-- Weekly check-ins (Monday morning weigh-ins)
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_date  date NOT NULL UNIQUE,
  weight_lbs    numeric(5,1) NOT NULL,
  weight_kg     numeric(5,2) GENERATED ALWAYS AS (ROUND((weight_lbs / 2.20462)::numeric, 2)) STORED,
  waist_cm      numeric(5,1),
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_date ON weekly_checkins(checkin_date);

-- ============================================
-- Seed initial data
-- ============================================

-- Insert the profile row
INSERT INTO profiles (name, age, height_cm, start_weight_lbs, affiliation)
VALUES ('Meddhuvir', 43, 178.0, 211.0, 'Order of Fire')
ON CONFLICT DO NOTHING;

-- Insert starting nutrition targets
INSERT INTO targets (calories, calories_min, calories_max, protein_g, carbs_min_g, carbs_max_g, fat_min_g, fat_max_g, effective_from, notes)
VALUES (2250, 2100, 2400, 180, 200, 230, 55, 70, CURRENT_DATE, 'Initial targets — Phase I cut')
ON CONFLICT DO NOTHING;

-- Insert the starting weight check-in
INSERT INTO weekly_checkins (checkin_date, weight_lbs, waist_cm, notes)
VALUES (CURRENT_DATE, 211.0, NULL, 'Starting weight — Day 1 of Ascension')
ON CONFLICT (checkin_date) DO NOTHING;
```

> **What just happened:** You created 5 tables in your PostgreSQL database (hosted by Supabase) and seeded the initial profile and starting weight. You can verify the tables were created by clicking **Table Editor** in the left sidebar — you should see all 5 tables listed.

---

### Phase D — Set Up Row Level Security (RLS)

> **What is RLS?** Row Level Security is PostgreSQL's built-in access control system. It lets you define rules like "anyone can read this table, but only logged-in users can write to it." This is what makes your public dashboard safe — even though the anon key is exposed in your React code, RLS ensures that key can only read data, never write or delete it.

**Step D1 — Open the SQL Editor again (or clear the previous query) and run this:**

```sql
-- ============================================
-- HEKBOT: Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC (anon) POLICIES — READ ONLY
-- The anon role is what the public dashboard uses.
-- It can SELECT (read) but never INSERT/UPDATE/DELETE.
-- ============================================

CREATE POLICY "Public can read profiles"
  ON profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can read targets"
  ON targets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can read food logs"
  ON food_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can read workout logs"
  ON workout_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can read check-ins"
  ON weekly_checkins FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- AUTHENTICATED USER POLICIES — FULL ACCESS
-- The authenticated role is what the admin portal uses
-- after you log in via Supabase Auth.
-- ============================================

CREATE POLICY "Authenticated can do everything on profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can do everything on targets"
  ON targets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can do everything on food_logs"
  ON food_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can do everything on workout_logs"
  ON workout_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can do everything on weekly_checkins"
  ON weekly_checkins FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

> **What just happened:** You turned on RLS for all 5 tables and created two sets of rules:
> - **anon** (public) — can only SELECT (read). Cannot insert, update, or delete anything.
> - **authenticated** (logged-in admin) — full access to all tables.
>
> You can verify this in Supabase: go to **Table Editor → [any table] → RLS** and you'll see the policies listed.

---

### Phase E — Create the Admin User

**Step E1 — Go to Authentication**
1. Click **Authentication** in the left sidebar
2. Click **Users**
3. Click **Invite user** or **Add user → Create new user**
4. Enter your email address and a strong password
5. Click **Create user**

> **What just happened:** Supabase created a user account in its auth system. When you log into `/admin` in the app, Supabase verifies your credentials and returns a session token (JWT). That token is what tells Supabase "this is an authenticated user" and unlocks the write policies you set up above.

**Step E2 — Confirm the email (if required)**
Supabase may send a confirmation email. Click the link in that email to activate the account. (You can also disable email confirmation in Authentication → Settings → "Email confirmations" for a dev project.)

---

## 10. Scaffold Order & Build Plan

The app is built in this sequence. Pause after each phase to confirm it's working before moving on.

### Phase 1 — Project Bootstrap
- [ ] Create GitHub repo (`hekbot`)
- [ ] Scaffold React + Vite project: `npm create vite@latest hekbot -- --template react`
- [ ] Install dependencies: Tailwind, Recharts, Supabase JS client, React Router
- [ ] Set up `.env` with Supabase keys
- [ ] Add `netlify.toml`
- [ ] Create `supabaseClient.js`
- [ ] Push to GitHub, connect to Netlify, verify deploy

### Phase 2 — Data Layer
- [ ] Write all read queries in `lib/queries.js`
- [ ] Write all write mutations in `lib/mutations.js`
- [ ] Build React hooks for each data type

### Phase 3 — Public Dashboard MVP
- [ ] Router setup (React Router v6)
- [ ] `PublicDashboard.jsx` — layout shell
- [ ] Daily Intake panel (read-only)
- [ ] Macro progress bars
- [ ] Weekly check-in summary card
- [ ] Weight Trend Chart

### Phase 4 — Admin Portal
- [ ] `AdminLogin.jsx` — Supabase Auth email/password form
- [ ] `AuthGuard.jsx` — redirect to login if not authenticated
- [ ] `AdminDashboard.jsx` — same layout as public + edit controls
- [ ] Food log CRUD (add/edit/delete)
- [ ] Workout log CRUD
- [ ] Weekly check-in form
- [ ] Targets editor

### Phase 5 — Full Charts & Polish
- [ ] All 4 chart types wired to real data
- [ ] Journey Progress indicator
- [ ] Profile panel with avatar
- [ ] Mobile layout
- [ ] Weekly/Historical view toggle

### Phase 6 — Hardening
- [ ] Verify public route cannot write data (test in DevTools)
- [ ] Confirm env vars are not leaking service role key
- [ ] Verify Netlify redirect rule works for `/admin`
- [ ] Add loading and error states to all data hooks

---

## 11. Future Phases (Out of Scope for v1)

The following features are documented here as planned future work. They are **not built in v1**.

| Feature | Notes |
|---|---|
| **Apple Health / HealthKit sync** | Would auto-import workout calories and step data from iPhone. Requires a native iOS bridge or Shortcuts automation. Planned for Phase 2. |
| **Barcode scanner** | Scan food barcodes to auto-populate macros. Requires integration with an external food database API (e.g., Open Food Facts, Nutritionix). |
| **Bulk food import** | Paste a meal from MyFitnessPal or Cronometer, parse macros automatically. |
| **Progress photo gallery** | Upload weekly photos, displayed in a timeline. Supabase Storage. |
| **AI meal planning** | Suggest daily meal plans to hit macro targets. |
| **Multi-user support** | Currently single-user (admin = single account). Multi-user would require per-user RLS policies. |
| **Reta dosing log** | Dedicated table for logging GLP-1 injection schedule and dose adjustments. |
| **Retatrutide effectiveness analysis** | Correlate weight loss rate to dosing schedule. |

---

*PROJECT_SPEC.md — Ascension Fitness Dashboard · v1.0 · June 2026*  
*DN Creative LLC · dan.nemirovsky@gmail.com*
