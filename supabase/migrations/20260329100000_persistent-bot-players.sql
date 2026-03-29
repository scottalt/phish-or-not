-- Persistent bot players: add identity columns and seed 15 bot players
-- Each bot has a unique personality (speed, accuracy, hesitation) stored in bot_config

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS bot_config JSONB;

-- Seed 15 persistent bot players
-- Deterministic UUIDs make migration idempotent (ON CONFLICT DO NOTHING)
-- auth_id uses a different namespace — no Supabase Auth user can match these
INSERT INTO players (id, auth_id, display_name, is_bot, research_graduated, bot_config) VALUES
  ('00000000-0000-0000-b070-000000000001', '00000000-0000-0000-b0a0-000000000001', 'ZERO_COOL',      TRUE, TRUE, '{"speed_factor": 0.70, "accuracy": 0.92, "hesitation_chance": 0.10}'::jsonb),
  ('00000000-0000-0000-b070-000000000002', '00000000-0000-0000-b0a0-000000000002', 'ACID_BURN',       TRUE, TRUE, '{"speed_factor": 0.60, "accuracy": 0.83, "hesitation_chance": 0.05}'::jsonb),
  ('00000000-0000-0000-b070-000000000003', '00000000-0000-0000-b0a0-000000000003', 'ROOT_KIT',        TRUE, TRUE, '{"speed_factor": 1.00, "accuracy": 0.95, "hesitation_chance": 0.25}'::jsonb),
  ('00000000-0000-0000-b070-000000000004', '00000000-0000-0000-b0a0-000000000004', 'CRASH_OVERRIDE',  TRUE, TRUE, '{"speed_factor": 0.85, "accuracy": 0.90, "hesitation_chance": 0.15}'::jsonb),
  ('00000000-0000-0000-b070-000000000005', '00000000-0000-0000-b0a0-000000000005', 'THE_PLAGUE',      TRUE, TRUE, '{"speed_factor": 0.75, "accuracy": 0.88, "hesitation_chance": 0.10}'::jsonb),
  ('00000000-0000-0000-b070-000000000006', '00000000-0000-0000-b0a0-000000000006', 'DARK_TANGENT',    TRUE, TRUE, '{"speed_factor": 0.95, "accuracy": 0.94, "hesitation_chance": 0.20}'::jsonb),
  ('00000000-0000-0000-b070-000000000007', '00000000-0000-0000-b0a0-000000000007', 'PACKET_STORM',    TRUE, TRUE, '{"speed_factor": 0.65, "accuracy": 0.85, "hesitation_chance": 0.08}'::jsonb),
  ('00000000-0000-0000-b070-000000000008', '00000000-0000-0000-b0a0-000000000008', 'BYTE_FORCE',      TRUE, TRUE, '{"speed_factor": 0.80, "accuracy": 0.91, "hesitation_chance": 0.12}'::jsonb),
  ('00000000-0000-0000-b070-000000000009', '00000000-0000-0000-b0a0-000000000009', 'CIPHER_NET',      TRUE, TRUE, '{"speed_factor": 0.90, "accuracy": 0.93, "hesitation_chance": 0.18}'::jsonb),
  ('00000000-0000-0000-b070-00000000000a', '00000000-0000-0000-b0a0-00000000000a', 'STACK_TRACE',     TRUE, TRUE, '{"speed_factor": 0.75, "accuracy": 0.86, "hesitation_chance": 0.10}'::jsonb),
  ('00000000-0000-0000-b070-00000000000b', '00000000-0000-0000-b0a0-00000000000b', 'KERN_PANIC',      TRUE, TRUE, '{"speed_factor": 0.65, "accuracy": 0.82, "hesitation_chance": 0.05}'::jsonb),
  ('00000000-0000-0000-b070-00000000000c', '00000000-0000-0000-b0a0-00000000000c', 'DEAD_DROP',       TRUE, TRUE, '{"speed_factor": 0.95, "accuracy": 0.89, "hesitation_chance": 0.20}'::jsonb),
  ('00000000-0000-0000-b070-00000000000d', '00000000-0000-0000-b0a0-00000000000d', 'WIRE_SHARK',      TRUE, TRUE, '{"speed_factor": 0.85, "accuracy": 0.92, "hesitation_chance": 0.15}'::jsonb),
  ('00000000-0000-0000-b070-00000000000e', '00000000-0000-0000-b0a0-00000000000e', 'NET_SCOUT',       TRUE, TRUE, '{"speed_factor": 0.70, "accuracy": 0.87, "hesitation_chance": 0.10}'::jsonb),
  ('00000000-0000-0000-b070-00000000000f', '00000000-0000-0000-b0a0-00000000000f', 'HONEY_POT',       TRUE, TRUE, '{"speed_factor": 1.00, "accuracy": 0.84, "hesitation_chance": 0.25}'::jsonb)
ON CONFLICT (id) DO NOTHING;
