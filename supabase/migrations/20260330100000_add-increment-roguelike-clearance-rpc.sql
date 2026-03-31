-- Atomic roguelike clearance increment — prevents race conditions on concurrent
-- run completions or upgrade purchases.

CREATE OR REPLACE FUNCTION increment_roguelike_clearance(player_id UUID, amount INT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE players
  SET roguelike_clearance = GREATEST(0, roguelike_clearance + amount)
  WHERE id = player_id;
END;
$$;
