-- Seed roguelike cards from existing freeplay/expert pool (80 cards, mixed difficulty)
-- Safe to run multiple times — ON CONFLICT DO NOTHING

INSERT INTO cards_generated (card_id, pool, type, is_phishing, difficulty, from_address, subject, body, clues, explanation, highlights, technique, auth_status, reply_to, attachment_name, sent_at)
SELECT
  'rl-' || card_id,
  'roguelike',
  type, is_phishing, difficulty, from_address, subject, body, clues, explanation, highlights, technique, auth_status, reply_to, attachment_name, sent_at
FROM cards_generated
WHERE pool IN ('freeplay', 'expert')
ORDER BY random()
LIMIT 80
ON CONFLICT (card_id) DO NOTHING;
