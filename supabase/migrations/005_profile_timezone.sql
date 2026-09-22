-- ============================================================
-- HEKBOT: Profile timezone
-- Adds an explicit, user-configurable timezone to the profile so
-- "today" (dashboard reset, HekBot's coaching context) is computed
-- from the IANA zone the user actually lives in, not guessed from
-- whatever timezone the browser/device happens to be set to.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York';
