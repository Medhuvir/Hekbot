-- ============================================================
-- HEKBOT: Training days
-- Adds an explicit, user-configurable weekly training schedule to the
-- profile so HekBot can read and update it, instead of the days being
-- hardcoded into the chat edge function's system prompt.
-- Shape: {"mon": "Resistance Training"|"Martial Arts"|"Other"|null, "tue": ..., ... "sun": ...}
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS training_days jsonb NOT NULL DEFAULT '{
    "mon": "Resistance Training",
    "tue": "Martial Arts",
    "wed": "Resistance Training",
    "thu": "Martial Arts",
    "fri": "Resistance Training",
    "sat": "Martial Arts",
    "sun": null
  }'::jsonb;
