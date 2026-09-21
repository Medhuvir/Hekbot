-- ============================================================
-- HEKBOT: Food presets + review-before-save support
-- Run this in Supabase SQL Editor after 003_ has been applied
-- ============================================================

-- ── food_presets: bookmarked meals for one-tap re-logging ────
CREATE TABLE IF NOT EXISTS food_presets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  meal_type  text CHECK (meal_type IN ('breakfast','lunch','dinner','snack','drink')),
  calories   integer NOT NULL DEFAULT 0,
  protein_g  numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g    numeric(6,1) NOT NULL DEFAULT 0,
  fat_g      numeric(6,1) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_presets_name ON food_presets(name);

ALTER TABLE food_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read food presets"
  ON food_presets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can do everything on food_presets"
  ON food_presets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── food_logs: allow 'preset' as a logging source ────────────
ALTER TABLE food_logs DROP CONSTRAINT food_logs_source_check;
ALTER TABLE food_logs ADD CONSTRAINT food_logs_source_check
  CHECK (source IN ('text','image','manual','preset'));
