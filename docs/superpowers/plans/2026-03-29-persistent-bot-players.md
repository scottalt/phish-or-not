# Persistent Bot Players Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 15 persistent bot players with real DB identities, unique personalities, and organic rank progression that appear on the leaderboard and provide meaningful PVP competition.

**Architecture:** Bot players are real rows in the `players` table with `is_bot: true` and a `bot_config` JSONB column for personality. The bot route picks a persistent bot as `player2_id` when `H2H_PERSISTENT_BOTS=true`, creating a normal two-player match that flows through the existing rated finalizeMatch path. Ghost_match fallback stays intact as a kill switch.

**Tech Stack:** Supabase (Postgres migration), Next.js API routes, React client, Redis

**Spec:** `docs/superpowers/specs/2026-03-29-persistent-bot-players-design.md`

---

### Task 1: Database Migration — Add `is_bot`, `bot_config` columns and seed bot players

**Files:**
- Create: `supabase/migrations/20260329100000_persistent-bot-players.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Add bot identity columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS bot_config JSONB;

-- Seed 15 persistent bot players
-- Using deterministic UUIDs so the migration is idempotent (ON CONFLICT DO NOTHING)
-- auth_id uses a different namespace so no Supabase Auth user can match
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
```

- [ ] **Step 2: Run the migration against production**

```bash
# Apply via Supabase dashboard SQL editor or CLI
# Copy the contents of supabase/migrations/20260329100000_persistent-bot-players.sql
```

- [ ] **Step 3: Verify bot rows exist**

Run in Supabase SQL editor:
```sql
SELECT id, display_name, is_bot, bot_config FROM players WHERE is_bot = TRUE;
```
Expected: 15 rows with bot names and config.

- [ ] **Step 4: Verify leaderboard still works**

Visit the app, open PVP mode, check the leaderboard. Bots should NOT appear yet (they have no `h2h_player_stats` rows — those get created when they play their first match).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260329100000_persistent-bot-players.sql
git commit -m "feat: add persistent bot players migration — is_bot column + 15 bot seeds"
```

**🛑 TESTING CHECKPOINT: Verify bot rows exist in DB and leaderboard still works before proceeding.**

---

### Task 2: Add `BotConfig` type to `lib/h2h.ts`

**Files:**
- Modify: `lib/h2h.ts`

- [ ] **Step 1: Add the BotConfig type and bot player ID prefix constant**

Add after the existing `CURRENT_SEASON` constant at the top of the file:

```typescript
// ── Persistent bot players ──

export const BOT_PLAYER_ID_PREFIX = '00000000-0000-0000-b070-';

export interface BotConfig {
  speed_factor: number;   // 0.6–1.0 — multiplier on base answer time (lower = faster)
  accuracy: number;       // 0.82–0.95 — per-card chance of getting it right
  hesitation_chance: number; // 0.05–0.25 — chance of pausing on a card
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/h2h.ts
git commit -m "feat: add BotConfig type and bot player ID prefix"
```

---

### Task 3: Update bot route to pick persistent bot players

**Files:**
- Modify: `app/api/h2h/queue/bot/route.ts`

- [ ] **Step 1: Add persistent bot selection logic**

At the top of the `POST` function, after the bot-lock acquisition (after line 59), add the persistent bot selection. The key change: when `H2H_PERSISTENT_BOTS` is enabled, query for an eligible bot player, and create the match with `player2_id: bot.id` and `is_ghost_match: false` instead of `player2_id: null` and `is_ghost_match: true`.

Replace the match creation block (lines 97-111) and the section from `console.log('[bot] creating match...')` onward. The full updated `POST` function body after the `activeMatch` check (after line 94) should be:

```typescript
  console.log(`[bot] creating match for ${playerId.slice(0,8)}`);

  // ── Persistent bot selection (when enabled) ──
  let botPlayerId: string | null = null;

  if (process.env.H2H_PERSISTENT_BOTS === 'true') {
    // Fetch player's rank for tier-matching
    const { data: playerStats } = await admin
      .from('h2h_player_stats')
      .select('rank_points')
      .eq('player_id', playerId)
      .eq('season', CURRENT_SEASON)
      .single();

    const playerPoints = playerStats?.rank_points ?? 0;

    // Get all bot players with their stats for this season
    const { data: bots } = await admin
      .from('players')
      .select('id, bot_config, h2h_player_stats!player_id(rank_points, rated_matches_today, last_match_date)')
      .eq('is_bot', true);

    if (bots && bots.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const { getRankFromPoints } = await import('@/lib/h2h');
      const playerRank = getRankFromPoints(playerPoints);

      // Filter: under daily cap, then sort by rank proximity
      const eligible = bots
        .map((bot) => {
          const stats = Array.isArray(bot.h2h_player_stats)
            ? bot.h2h_player_stats[0]
            : bot.h2h_player_stats;
          const ratedToday =
            stats?.last_match_date === today
              ? stats.rated_matches_today ?? 0
              : 0;
          const botPoints = stats?.rank_points ?? 0;
          const botRank = getRankFromPoints(botPoints);
          return { id: bot.id, ratedToday, botRank, botPoints };
        })
        .filter((b) => b.ratedToday < 20);

      if (eligible.length > 0) {
        // Sort by tier proximity to player, then random tiebreak
        const playerTierIdx = H2H_RANKS.findIndex((r) => r.tier === playerRank.tier);
        eligible.sort((a, b) => {
          const aDiff = Math.abs(H2H_RANKS.findIndex((r) => r.tier === a.botRank.tier) - playerTierIdx);
          const bDiff = Math.abs(H2H_RANKS.findIndex((r) => r.tier === b.botRank.tier) - playerTierIdx);
          if (aDiff !== bDiff) return aDiff - bDiff;
          return Math.random() - 0.5;
        });
        botPlayerId = eligible[0].id;
      }
    }
  }

  // Create match — persistent bot or ghost fallback
  const { data: match, error } = await admin
    .from('h2h_matches')
    .insert({
      season: CURRENT_SEASON,
      player1_id: playerId,
      player2_id: botPlayerId,
      card_ids: [],
      status: 'active',
      is_ghost_match: botPlayerId === null,
      is_rated: true,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
```

Also add the import at the top of the file:

```typescript
import { CURRENT_SEASON, H2H_CARDS_PER_MATCH, H2H_MATCH_TTL, H2H_RANKS } from '@/lib/h2h';
```

- [ ] **Step 2: Update render timestamp for bot player (persistent bots only)**

After the card dealing and render timestamp section (after line 159), add a render timestamp for the bot player so AFK detection doesn't immediately flag them:

```typescript
  // Set render timestamp for bot player too (prevents AFK detection on persistent bots)
  if (botPlayerId) {
    await redis.set(`match-render:${match.id}:${botPlayerId}:0`, Date.now(), { ex: H2H_MATCH_TTL });
  }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/h2h/queue/bot/route.ts
git commit -m "feat: bot route picks persistent bot player when H2H_PERSISTENT_BOTS=true"
```

**🛑 TESTING CHECKPOINT: Set `H2H_PERSISTENT_BOTS=true` in .env.local. Queue for PVP, wait for bot match. Check in Supabase that the match has a real `player2_id` and `is_ghost_match=false`. Then set env to `false` and verify ghost_match fallback still works.**

---

### Task 4: Update match GET endpoint to return `isBot` and `botConfig`

**Files:**
- Modify: `app/api/h2h/match/[id]/route.ts`

- [ ] **Step 1: Include `is_bot` and `bot_config` in the player query**

In the GET handler, update the player select query (line 74-76) to include the new columns:

```typescript
  const { data: players } = await admin
    .from('players')
    .select('id, display_name, featured_badge, featured_badges, theme_id, is_bot, bot_config')
    .in('id', playerIds);
```

- [ ] **Step 2: Add `isBot` and `botConfig` to the playerMap**

Update the playerMap type and population (lines 78-89):

```typescript
  const playerMap: Record<string, { displayName: string; featuredBadge: string | null; themeColor: string; nameEffect: string | null; isBot: boolean; botConfig: Record<string, number> | null }> = {};
  for (const p of players ?? []) {
    const badges = p.featured_badges as string[] | null;
    const pvpBadge = badges?.[0] ?? p.featured_badge ?? null;
    const theme = THEMES.find(t => t.id === (p.theme_id ?? 'phosphor'));
    playerMap[p.id] = {
      displayName: p.display_name,
      featuredBadge: pvpBadge,
      themeColor: theme?.colors.primary ?? '#00ff41',
      nameEffect: theme?.nameEffect ?? null,
      isBot: p.is_bot ?? false,
      botConfig: p.bot_config ?? null,
    };
  }
```

- [ ] **Step 3: Update `isBotMatch` in the response to check player `is_bot` field**

Update the response (line 189). The match is a bot match if either `is_ghost_match` is true (old system) OR the opponent is a bot player (new system):

```typescript
      isBotMatch: match.is_ghost_match || Object.values(playerMap).some((p) => p.isBot),
```

- [ ] **Step 4: Commit**

```bash
git add app/api/h2h/match/[id]/route.ts
git commit -m "feat: match GET returns isBot and botConfig for bot opponents"
```

---

### Task 5: Update client to derive `isBot` from match data and use bot personality

**Files:**
- Modify: `components/H2HMatch.tsx`
- Modify: `components/Game.tsx`

- [ ] **Step 1: Update H2HMatch to read `botConfig` from match data**

In the `init()` function inside the mount useEffect (around line 348-362), update the bot detection and config reading. After the opponent name/badge setup:

```typescript
        } else if (isBot) {
          const { getRandomBotName } = await import('@/lib/h2h');
          setOpponentName(getRandomBotName(matchId));
        }
```

Change to:

```typescript
        } else if (isBot) {
          // Persistent bot — use their display name from server
          // Ghost bot fallback — generate a name from matchId
          const { getRandomBotName } = await import('@/lib/h2h');
          setOpponentName(getRandomBotName(matchId));
        }

        // Read bot personality config from opponent data (persistent bots)
        const oppId = opponentId;
        if (oppId && matchData.players[oppId]?.botConfig) {
          setBotConfig(matchData.players[oppId].botConfig);
        }
```

Add the `botConfig` state near the other state declarations (around line 234):

```typescript
  const [botConfig, setBotConfig] = useState<{ speed_factor: number; accuracy: number; hesitation_chance: number } | null>(null);
```

- [ ] **Step 2: Update bot simulation to use personality from `botConfig`**

In the bot simulation useEffect (around line 523), replace the hardcoded personality values with `botConfig` when available:

```typescript
  useEffect(() => {
    if (!isBot || loading || eliminated || finished || cards.length === 0) return;

    // Use persistent bot personality or random fallback (ghost bots)
    const speedFactor = botConfig?.speed_factor ?? (0.6 + Math.random() * 0.4);
    const accuracy = botConfig?.accuracy ?? (0.85 + Math.random() * 0.10);
    const hesitationChance = botConfig?.hesitation_chance ?? 0.15;

    // Per-card timing
    const botTimes = cards.map((card) => {
      const len = card.body.length;
      let baseMs: number;
      if (len < 300) baseMs = 3000 + Math.random() * 4000;
      else if (len < 600) baseMs = 5000 + Math.random() * 5000;
      else baseMs = 7000 + Math.random() * 7000;

      baseMs *= speedFactor;

      if (Math.random() < hesitationChance) {
        baseMs += 1000 + Math.random() * 1000;
      }

      return baseMs;
    });

    // Per-card failure based on accuracy
    let botEliminationCard = -1;
    for (let i = 0; i < cards.length; i++) {
      if (Math.random() > accuracy) {
        botEliminationCard = i;
        break;
      }
    }
```

The rest of the simulation (timers, elimination logic, win logic) stays exactly the same.

- [ ] **Step 3: Update H2HMatch to detect bot from match data instead of only the prop**

The `isBot` prop from Game.tsx still works for ghost_match bots. For persistent bots, the match GET endpoint now returns `isBotMatch: true`. The `init()` function in H2HMatch should check the server response:

After `setCards(cardsData)` and `const matchData = await matchRes.json()` (around line 338), add before the opponent name setup:

```typescript
        // Detect persistent bot from server data (overrides client prop for display consistency)
        const opponentPlayer = opponentId ? matchData.players[opponentId] : null;
        const isOpponentBot = opponentPlayer?.isBot ?? false;
```

Use `isOpponentBot` to set the opponent name — for persistent bots, use their real display name from the server:

```typescript
        if (opponentId && matchData.players[opponentId] && !isOpponentBot) {
          // Real human opponent
          const opp = matchData.players[opponentId];
          setOpponentName(opp.displayName);
          if (opp.themeColor) setOpponentThemeColor(opp.themeColor);
          if (opp.nameEffect) setOpponentNameEffect(opp.nameEffect);
          if (opp.featuredBadge) {
            const oppAch = ACHIEVEMENTS.find(a => a.id === opp.featuredBadge);
            setOpponentBadgeIcon(oppAch?.icon ?? null);
            setOpponentBadgeName(oppAch?.name ?? null);
            setOpponentBadgeRarity(oppAch?.rarity ?? null);
          }
        } else if (isOpponentBot && opponentId && matchData.players[opponentId]) {
          // Persistent bot — use their real display name + theme
          const opp = matchData.players[opponentId];
          setOpponentName(opp.displayName);
          if (opp.themeColor) setOpponentThemeColor(opp.themeColor);
        } else if (isBot) {
          // Ghost bot fallback
          const { getRandomBotName } = await import('@/lib/h2h');
          setOpponentName(getRandomBotName(matchId));
        }
```

- [ ] **Step 4: Add `botConfig` to the simulation useEffect dependency array**

```typescript
  }, [isBot, loading, eliminated, finished, cards.length, botConfig]);
```

- [ ] **Step 5: Commit**

```bash
git add components/H2HMatch.tsx components/Game.tsx
git commit -m "feat: client reads bot personality from match data, simulation uses per-bot config"
```

**🛑 TESTING CHECKPOINT: Play a bot match with `H2H_PERSISTENT_BOTS=true`. Verify:**
- **Bot has a real name** (from DB, not random)
- **Bot plays with its personality** (fast bots are fast, slow bots are slow)
- **Match results award rank points to both player AND bot** (check h2h_player_stats in DB)
- **Leaderboard shows the bot** (after at least one match)

---

### Task 6: Update H2HResult to handle persistent bot opponent display

**Files:**
- Modify: `components/H2HResult.tsx`

- [ ] **Step 1: Detect persistent bot from match data**

In the `load()` function, after the opponent data is read (around line 182), the opponent name for persistent bots should come from the server's `players` map (their real display_name). The current code already does `oppName: oppPlayer?.displayName ?? (isBot ? getRandomBotName(matchId) : 'OPPONENT')`. For persistent bots, `oppPlayer` will exist (since they have a real player2_id), so `oppPlayer.displayName` will be used automatically. No change needed here.

- [ ] **Step 2: Verify no changes needed**

The result screen already:
- Shows rank/XP for bot matches (we removed the `isBot` gates earlier)
- Shows the opponent name from `oppPlayer.displayName` (works for persistent bots since they're real players)
- Plays sounds and SIGINT triggers for bot matches

No code changes needed for this task — just verify manually.

- [ ] **Step 3: Commit (skip if no changes)**

No commit needed — this is a verification step.

---

### Task 7: Update leaderboard to include `isBot` field (not surfaced in UI)

**Files:**
- Modify: `app/api/h2h/leaderboard/route.ts`

- [ ] **Step 1: Add `is_bot` to the leaderboard query and response**

Update the select query (line 12):

```typescript
  const { data, error } = await admin
    .from('h2h_player_stats')
    .select('player_id, rank_points, wins, losses, players!player_id(display_name, theme_id, is_bot)')
    .eq('season', CURRENT_SEASON)
    .order('rank_points', { ascending: false })
    .limit(100);
```

Add `isBot` to each leaderboard entry (inside the `.map()`, after `themeColor`):

```typescript
      isBot: player?.is_bot ?? false,
```

- [ ] **Step 2: Commit**

```bash
git add app/api/h2h/leaderboard/route.ts
git commit -m "feat: leaderboard includes isBot field (not surfaced in UI)"
```

---

### Task 8: Handle AFK detection for persistent bot matches

**Files:**
- Modify: `app/api/h2h/match/[id]/route.ts`

- [ ] **Step 1: Skip AFK check for bot opponent in persistent bot matches**

The current AFK check (lines 142-178) runs for non-ghost matches with two players. Persistent bot matches have `is_ghost_match: false` and a real `player2_id`, so they'd trigger AFK detection on the bot — which never updates its render timestamp after the initial one.

Update the AFK check condition (line 144) to also exclude matches where either player is a bot:

```typescript
  const anyPlayerIsBot = Object.values(playerMap).some((p) => p.isBot);
  if (match.status === 'active' && !match.is_ghost_match && !anyPlayerIsBot && match.player1_id && match.player2_id) {
```

This uses the `playerMap` already built above, which now includes `isBot`.

- [ ] **Step 2: Commit**

```bash
git add app/api/h2h/match/[id]/route.ts
git commit -m "fix: skip AFK detection for persistent bot matches"
```

---

### Task 9: Final integration testing and push

- [ ] **Step 1: Full integration test with `H2H_PERSISTENT_BOTS=true`**

1. Queue for PVP, wait 30-45s
2. Verify lobby shows a named bot opponent (e.g., ZERO_COOL)
3. Accept match, play through, verify bot plays with personality
4. Check results screen shows rank points for you
5. Check `h2h_player_stats` in DB — bot should have stats row
6. Check leaderboard — bot should appear if it has rank points
7. Play 2-3 more matches to verify different bots are selected

- [ ] **Step 2: Kill switch test**

1. Set `H2H_PERSISTENT_BOTS=false` (or remove the env var)
2. Queue for PVP, wait for timeout
3. Verify ghost_match fallback works (random bot name, match works normally)

- [ ] **Step 3: Push all changes**

```bash
git push origin master
```

**🛑 FINAL TESTING CHECKPOINT: Play several bot matches in production, verify leaderboard, verify kill switch, verify rank progression for both player and bot.**
