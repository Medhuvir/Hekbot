-- ============================================================
-- HEKBOT: Google Fit OAuth tokens
-- Run this in Supabase SQL Editor after 002_ has been applied
-- ============================================================

-- ── google_tokens: single-row store for the Google Fit OAuth grant ──
-- Written only by the google-auth-callback Edge Function (service role).
-- Read only by Edge Functions that sync Google Fit data (service role).
CREATE TABLE IF NOT EXISTS google_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  text NOT NULL,
  refresh_token text NOT NULL,
  expires_at    timestamptz NOT NULL,
  scope         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Enable RLS — no public or authenticated client reads this directly;
-- Edge Functions use the service role key and bypass RLS.
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE policy for anon or authenticated — intentionally locked down.
