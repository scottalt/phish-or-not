-- Add per-player feature flags
ALTER TABLE players ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{}';

-- Global app settings table (single-row pattern)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the global feature flags row (deadlock off by default)
INSERT INTO app_settings (key, value)
VALUES ('feature_flags', '{"deadlock": false}')
ON CONFLICT (key) DO NOTHING;

-- RLS: app_settings readable by authenticated users, writable only via service role
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
  ON app_settings FOR SELECT
  USING (true);
