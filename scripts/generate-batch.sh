#!/usr/bin/env bash
# Generate all card batches for the 550-card v1 dataset
# Target: 360 phishing (6 techniques x 3 difficulties x 20) + 190 legit (70+60+60)
# Mix: 3 Haiku + 1 Sonnet per 20-card slot (model diversity, cost-controlled)
# Assumes staging queue is empty. If cards_real already has approved cards in a
# category, reduce the corresponding run count below before running.
set -e

CMD="npx ts-node --project tsconfig.scripts.json scripts/generate-cards.ts"
TECHNIQUES=("urgency" "authority-impersonation" "credential-harvest" "hyper-personalization" "pretexting" "fluent-prose")

run()  { echo ""; $CMD "$@"; }
runs() { echo ""; $CMD "$@" --model sonnet; }

# === EASY (6 techniques x 20 cards = 120 total) ===
echo "=== EASY ==="
for t in "${TECHNIQUES[@]}"; do
  run  --technique "$t" --difficulty easy --count 5
  run  --technique "$t" --difficulty easy --count 5
  run  --technique "$t" --difficulty easy --count 5
  runs --technique "$t" --difficulty easy --count 5
done

# === MEDIUM (6 techniques x 20 cards = 120 total) ===
echo "=== MEDIUM ==="
for t in "${TECHNIQUES[@]}"; do
  run  --technique "$t" --difficulty medium --count 5
  run  --technique "$t" --difficulty medium --count 5
  run  --technique "$t" --difficulty medium --count 5
  runs --technique "$t" --difficulty medium --count 5
done

# === HARD (6 techniques x 20 cards = 120 total) ===
echo "=== HARD ==="
for t in "${TECHNIQUES[@]}"; do
  run  --technique "$t" --difficulty hard --count 5
  run  --technique "$t" --difficulty hard --count 5
  run  --technique "$t" --difficulty hard --count 5
  runs --technique "$t" --difficulty hard --count 5
done

# === LEGITIMATE (190 cards) ===
echo "=== LEGIT ==="
for i in $(seq 1 7); do run --category transactional --count 10; done  # 70
for i in $(seq 1 6); do run --category marketing     --count 10; done  # 60
for i in $(seq 1 6); do run --category workplace     --count 10; done  # 60

echo ""
echo "=== ALL GENERATION COMPLETE ==="
echo "Review staged cards at /admin/review"
