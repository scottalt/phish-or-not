# Persistent Bot Players — Design Spec

**Date:** 2026-03-29
**Status:** Approved

## Problem

PVP mode has a cold-start problem — nobody plays because nobody is playing. Bot matches exist as a fallback after 30-45s in queue, but they're anonymous ghosts with no identity, no persistent stats, and no leaderboard presence. The PVP ecosystem feels empty.

## Solution

Create 15 persistent bot players with real database identities, unique personalities, and organic rank progression. They appear on the leaderboard, accumulate stats, and provide meaningful competition. Players encounter them as opponents without knowing they're bots.

## Kill Switch

Environment variable `H2H_PERSISTENT_BOTS` (default `true` once deployed).

- `true` → bot route picks a persistent bot player as `player2_id`, match flows through existing two-player rated path
- `false` / missing → falls back to current ghost_match behavior (anonymous bot, `player2_id: null`)

Flip in Vercel dashboard, no deploy needed. The ghost_match code path stays intact permanently as the fallback.

## Design

### 1. Bot Player Identity

Add `is_bot BOOLEAN DEFAULT FALSE` column to the `players` table.

Seed 15 bot rows with:
- Deterministic UUIDs (e.g., `00000000-0000-0000-bot0-000000000001` through `...00f`)
- Deterministic `auth_id` values (different namespace — no matching Supabase Auth user exists, so login is impossible)
- `display_name` from existing BOT_NAMES array
- `research_graduated: true`
- `is_bot: true`
- `bot_config JSONB` column on players table storing personality

**`bot_config` schema:**
```json
{
  "speed_factor": 0.7,
  "accuracy": 0.90,
  "hesitation_chance": 0.15,
  "style": "aggressive"
}
```

### 2. Bot Personalities

Each bot has a distinct play style defined by their `bot_config`. Players learn these over time and develop counter-strategies.

| Bot | Speed | Accuracy | Per-card surv. | 5/5 rate | Style |
|-----|-------|----------|---------------|----------|-------|
| ZERO_COOL | 0.70 | 0.92 | 92% | ~66% | Fast, skilled |
| ACID_BURN | 0.60 | 0.83 | 83% | ~40% | Very fast, error-prone |
| ROOT_KIT | 1.00 | 0.95 | 95% | ~77% | Slow, methodical |
| CRASH_OVERRIDE | 0.85 | 0.90 | 90% | ~59% | Balanced |
| THE_PLAGUE | 0.75 | 0.88 | 88% | ~53% | Quick, moderate accuracy |
| DARK_TANGENT | 0.95 | 0.94 | 94% | ~73% | Careful, strong |
| PACKET_STORM | 0.65 | 0.85 | 85% | ~44% | Fast, sloppy |
| BYTE_FORCE | 0.80 | 0.91 | 91% | ~62% | Slightly fast, reliable |
| CIPHER_NET | 0.90 | 0.93 | 93% | ~70% | Moderate speed, accurate |
| STACK_TRACE | 0.75 | 0.86 | 86% | ~47% | Quick, inconsistent |
| KERN_PANIC | 0.65 | 0.82 | 82% | ~37% | Very fast, reckless |
| DEAD_DROP | 0.95 | 0.89 | 89% | ~56% | Slow, mid accuracy |
| WIRE_SHARK | 0.85 | 0.92 | 92% | ~66% | Balanced, skilled |
| NET_SCOUT | 0.70 | 0.87 | 87% | ~50% | Fast, moderate |
| HONEY_POT | 1.00 | 0.84 | 84% | ~42% | Very slow, tricky |

**Speed factor** multiplies the base answer time (lower = faster).
**Accuracy** is per-card chance of getting it right. 5/5 rate = accuracy^5.

No bot is unbeatable. Even ROOT_KIT (best accuracy) fails ~23% of the time, and can be outpaced. ACID_BURN and KERN_PANIC fail more than half the time but are dangerously fast when they survive.

### 3. Bot Selection (Queue Timeout)

When the 30-45s queue timeout fires and `H2H_PERSISTENT_BOTS=true`:

1. Query `players WHERE is_bot = true`
2. Left join `h2h_player_stats` for current season
3. Filter: `rated_matches_today < 20` (daily cap) — if all at cap, fall back to ghost_match
4. Rank-match: prefer bots near the player's rank tier (same tier-distance logic as real matchmaking)
5. Random pick from eligible candidates
6. Create match: `player2_id: bot.id`, `is_ghost_match: false`, `is_rated: true`

**Bots never match against other bots.** This is enforced by the queue system — bots don't join the queue, they're only selected as opponents for humans.

### 4. Match Flow

Since the match has a real `player2_id` and `is_ghost_match: false`, it flows through the **existing two-player rated path** in `finalizeMatch`. No changes needed to:
- `finalizeMatch` rated branch
- `update_h2h_stats` RPC (upserts for both players)
- `calculatePointsDelta` (real tier-vs-tier calculation)
- XP awarding (human only — bots don't have XP, which is fine since `awardH2HXp` just does a no-op update on their XP)
- Leaderboard queries

**Client-side:** The match GET endpoint returns `is_bot` and `bot_config` for bot opponents. The client uses the personality values for the bot simulation instead of random values. The `isBot` flag on the client is derived from the opponent's `is_bot` player field instead of `is_ghost_match`.

### 5. Leaderboard & Stats

**Leaderboard:** No query changes. Bots appear alongside real players, sorted by `rank_points`. The `isBot` field is included in the response but not surfaced in the UI — players don't know which entries are bots.

**Bot stats page:** Bots have a profile/stats page but it shows default/empty content (no games played from the player's perspective, just rank stats).

**Rank progression:** Bots start at 0 and climb organically. At ~20 matches/day with varying win rates (30-60% depending on personality and opponent skill), bots will spread across the rank tiers over days/weeks, creating a natural leaderboard population.

### 6. What Changes

| Area | Change |
|------|--------|
| **Migration** | Add `is_bot` and `bot_config` columns to players. Seed 15 bot rows. |
| **Bot route** (`/api/h2h/queue/bot`) | When env enabled, pick persistent bot as player2 instead of null. |
| **Match GET endpoint** | Return `bot_config` and derive `isBot` from opponent's `is_bot` field. |
| **Client simulation** (`H2HMatch.tsx`) | Read personality from match data instead of random values. |
| **Queue GET endpoint** | Return `isBot` based on opponent's `is_bot` field when matched. |

### 7. What Stays the Same

- Queue polling and human-to-human matchmaking (untouched)
- `finalizeMatch` two-player rated path (bots flow through it)
- `update_h2h_stats` RPC
- XP awarding logic
- Leaderboard queries
- Ghost_match fallback path (permanent, kill switch reverts to it)
- AFK detection
- Card dealing

### 8. Testing Checkpoints

The implementation should pause for manual testing at these points:

1. **After migration** — verify bot rows exist in DB, leaderboard still works
2. **After bot route change** — verify bot match creates with real player2_id, ghost_match fallback works with env var off
3. **After client personality integration** — verify different bots play differently, match results award rank to both players
4. **After full integration** — play several bot matches, check leaderboard shows bots with accumulated stats, flip kill switch and verify ghost_match fallback works
