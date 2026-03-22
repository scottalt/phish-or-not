-- Track whether authentication headers were visible to the player when they answered.
-- Existing rows get TRUE (headers were visible). New rows from the app will write FALSE.
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS auth_visible BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN answers.auth_visible IS 'Whether SPF/DKIM/DMARC headers were visible in the game UI when the player answered. TRUE for all pre-2026-03-22 data; FALSE after the header panel was removed to fix the auth-status/difficulty confound.';
