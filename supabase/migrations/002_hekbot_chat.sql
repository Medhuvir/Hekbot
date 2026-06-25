-- ============================================================
-- HEKBOT: Chat layer additions
-- Run this in Supabase SQL Editor after 001_ has been applied
-- ============================================================

-- ── food_logs: add HekBot extraction columns ─────────────────
ALTER TABLE food_logs
  ADD COLUMN IF NOT EXISTS meal_type  text CHECK (meal_type IN ('breakfast','lunch','dinner','snack','drink')),
  ADD COLUMN IF NOT EXISTS raw_input  text,
  ADD COLUMN IF NOT EXISTS confidence text CHECK (confidence IN ('high','medium','low')),
  ADD COLUMN IF NOT EXISTS source     text DEFAULT 'manual' CHECK (source IN ('text','image','manual'));

-- ── conversations: chat history (read/written only by Edge Function service role) ──
CREATE TABLE IF NOT EXISTS conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role       text NOT NULL CHECK (role IN ('user','assistant')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

-- Enable RLS — no public or authenticated client reads this directly;
-- the Edge Function uses the service role key and bypasses RLS.
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for anon or authenticated — intentionally locked down.
-- The Edge Function's service role key bypasses RLS entirely.
