# Roguelike Survival Mode — "Operation: DEADLOCK"

> **Date:** 2026-03-30
> **Branch:** v2.1
> **Status:** Design approved, ready for implementation planning

## Overview

A roguelike survival mode where players climb a 5-floor tower of increasingly difficult phishing challenges. Each run is randomly generated — floor gimmicks, card modifiers, and perk offerings are shuffled so no two runs play the same. Players earn Intel (run currency) to buy perks between floors and Clearance (permanent currency) to unlock meta-progression upgrades across runs.

**Gateway:** Research graduation (30 answers) — same unlock as PvP and other modes.

**Key principle:** Phishing awareness is boring as a quiz. This mode transforms it into a high-stakes, replayable game with real tension through lives, wagers, and escalating pressure.

---

## 1. Run Structure

- **5 floors per run**, 5 cards per floor (25 cards total)
- **3 lives** (default, upgradeable to 4). Wrong answer = lose 1 life. Lose all lives = run over.
- **Between each floor:** perk shop + SIGINT briefing
- **Win condition:** Clear all 5 floors
- **Loss condition:** Lose all lives (can happen on any floor)

### Floor Difficulty Escalation

| Floor | Card Difficulty | Modifiers Per Card | Timer |
|-------|----------------|-------------------|-------|
| 1     | Easy only       | 0-1               | None  |
| 2     | Easy-Medium     | 0-1               | If gimmick applies |
| 3     | Medium-Hard     | 1-2               | If gimmick applies |
| 4     | Hard-Extreme    | 2-3               | If gimmick applies |
| 5     | Extreme only    | 2-3               | Boss gimmick active |

---

## 2. Floor Gimmicks

Each floor gets a randomly assigned gimmick from a tiered pool. This ensures difficulty escalates but the experience varies per run.

### Tier 1 — Floor 1 (pick 1 randomly)

- **TRIAGE** — See an inbox of 3 emails. One is phishing. Find it.
- **FIRST LOOK** — Standard cards, no tricks. Easy warmup.
- **QUICK SCAN** — 8 easy cards in 60 seconds, rapid-fire.

### Tier 2 — Floors 2-4 (pick 3 randomly, assign in shuffled order)

- **UNDER PRESSURE** — Ticking timer per card (auto-submits when time runs out).
- **INVESTIGATION** — Inspect elements (reveal real URL, check sender domain). Each inspection costs Intel.
- **DECEPTION** — Decoy red flags on legit emails. Flawless phishing prose.
- **BLACKOUT** — Sender or subject redacted. Work with less information.
- **CHAIN MAIL** — Email threads where the attacker injected a message mid-conversation.
- **DOUBLE AGENT** — Two emails shown side by side. Pick which one is the phish (or both, or neither).
- **CONFIDENCE** — Wager Intel on your answer before seeing the result. Can appear on any Tier 2 floor (2-4). The HIGH ROLLER permanent upgrade makes it available from floor 2 regardless of gimmick assignment.

### Tier 3 — Floor 5 (pick 1 randomly)

- **BREACH** — Narrative chain. Your company is under attack. 5 messages mixing real incident response with attacker exploitation. Find the compromised messages.
- **SUPPLY CHAIN** — Vendor compromise scenario. Spot the poisoned link in trusted vendor communications.
- **INSIDER THREAT** — Internal employee gone rogue. Spot the data exfiltration attempt in internal comms.
- **APT** — Advanced persistent threat. Multi-stage attack across multiple email types.

---

## 3. Card Modifiers

On top of the floor gimmick, individual cards get random modifiers that change the card itself. More modifiers appear on higher floors.

| Modifier | Effect |
|----------|--------|
| LOOKALIKE DOMAIN | Subtle character swaps in sender domain (rn→m, 0→O) |
| DECOY RED FLAGS | Legit email has suspicious-looking elements |
| AI-ENHANCED | Phishing email has flawless grammar and prose |
| TIMED | Card auto-submits after countdown |
| REDACTED SENDER | From address hidden |
| REDACTED SUBJECT | Subject line hidden |
| SPOOFED BADGE | Fake "verified" indicator on phishing email |
| STRIPPED CONTEXT | No greeting, signature, or formatting context |
| URGENCY INJECTION | Fake deadline/urgency pressure |
| ATTACHMENT BAIT | Suspicious file attachment indicator |

### Anti-Pattern Rules

- Cards drawn from master pool **without replacement** — no card appears twice per run.
- Card pool must be **200+ cards** to ensure consecutive runs rarely overlap.
- Modifiers are randomly assigned per card per run — same card can have different modifiers in different runs.

---

## 4. Economy

### Intel (Run Currency)

Earned during the run, spent at the perk shop between floors. Gone when the run ends.

| Action | Intel |
|--------|-------|
| Correct answer | +10 |
| Speed bonus (<5s) | +5 |
| Streak bonus (3+ correct) | +3 per streak count |
| Confidence wager (correct) | 2x-3x wager |
| Floor clear bonus | +15 |
| Wrong answer | -5 |

### Clearance (Permanent Currency)

Earned at the end of each run based on floors cleared. Persists forever within roguelike mode. Not transferable to other modes.

| Achievement | Clearance |
|-------------|-----------|
| Floor 1 cleared | +5 |
| Floor 2 cleared | +10 |
| Floor 3 cleared | +20 |
| Floor 4 cleared | +35 |
| Floor 5 cleared | +50 |
| Full clear bonus | +25 |
| No deaths bonus | +15 |

**Full clear with no deaths = 160 Clearance per run.**
**Realistic run (die on floor 3-4) = 35-65 Clearance per run.**

---

## 5. Perk Shop

After clearing a floor, the player sees 3 random perks (4 with BLACK MARKET upgrade). Pick one or skip to save Intel. Perks last for the rest of the run.

### Perk Pool (~15 perks)

**Defense:**
| Perk | Cost | Effect |
|------|------|--------|
| EXTRA LIFE | 30 | +1 life (max 5) |
| SECOND CHANCE | 25 | Next wrong answer doesn't cost a life (once) |
| FIREWALL | 35 | Skip one card entirely (once per floor) |

**Intelligence:**
| Perk | Cost | Effect |
|------|------|--------|
| INFORMANT | 20 | 2 free inspections next floor |
| THREAT BRIEF | 15 | SIGINT reveals # of phishing cards next floor |
| PATTERN LOCK | 20 | Highlights one technique if it appears next floor |
| DEEP SCAN | 25 | Reveal all modifiers on each card before answering |

**Offense:**
| Perk | Cost | Effect |
|------|------|--------|
| BOUNTY HUNTER | 15 | +50% Intel for correct answers next floor |
| DOUBLE DOWN | 20 | Confidence wagers pay 3x instead of 2x |
| ADRENALINE | 10 | Speed bonus threshold relaxed (+3s) |
| STREAK MASTER | 15 | Streaks start counting from 2 instead of 3 |

**Utility:**
| Perk | Cost | Effect |
|------|------|--------|
| TIME DILATION | 15 | +5s on all timed cards |
| REROLL | 10 | Reroll one card you're unsure about (once per floor) |
| SIGNAL BOOST | 20 | SIGINT gives a hint on the hardest card next floor |
| ARCHIVE | 15 | View the last 3 cards you answered (check for patterns) |

**Note:** Some perks (SECOND CHANCE, INFORMANT, DEEP SCAN) are locked at the start. They enter the shop pool when the corresponding permanent upgrade is purchased.

---

## 6. Confidence Wager

Available on floors with the CONFIDENCE gimmick, or earlier via permanent upgrades.

### Flow

1. Read the card and decide: phish or legit
2. Place wager: 5 / 10 / 20 Intel (or skip with 0)
3. Submit answer
4. Result: correct = win 2x wager, wrong = lose wager + lose a life

### Design Intent

The wager happens **after deciding but before seeing the result**. This mirrors real-world phishing where you act on imperfect information. High confidence + correct = big Intel payout for perks. High confidence + wrong = devastating. Creates genuine tension.

---

## 7. Permanent Upgrades

Three branches, four tiers each. Higher tiers cost more. Total to max all: **600 Clearance** (~15-20 runs for a decent player).

### Survival Branch

| Tier | Name | Effect | Cost |
|------|------|--------|------|
| T1 | THICK SKIN | Start with 4 lives instead of 3 | 20 |
| T2 | FIELD MEDIC | Heal 1 life on floor clear (if below max) | 40 |
| T3 | SECOND WIND | Unlock SECOND CHANCE perk in shop pool | 60 |
| T4 | LAST STAND | At 1 life, correct answers give +3 Intel bonus | 80 |

### Intelligence Branch

| Tier | Name | Effect | Cost |
|------|------|--------|------|
| T1 | ANALYST EYE | Start each run with 1 free inspection | 20 |
| T2 | DEEP NETWORK | Unlock DEEP SCAN and INFORMANT perks in shop | 40 |
| T3 | SIGNAL INTERCEPT | SIGINT floor briefings reveal the gimmick name | 60 |
| T4 | OMNISCIENCE | See all card modifiers before answering (normally hidden) | 80 |

### Profit Branch

| Tier | Name | Effect | Cost |
|------|------|--------|------|
| T1 | HAZARD PAY | +15% Intel from correct answers | 20 |
| T2 | BLACK MARKET | Perk shop shows 4 options instead of 3 | 40 |
| T3 | HIGH ROLLER | Confidence wager unlocks on floor 2 (normally floor 4) | 60 |
| T4 | INSIDER TRADING | 10% discount on all perk prices | 80 |

### Design Principles

1. **Expand options, don't trivialize.** Most upgrades unlock new perks or information — they don't remove challenge.
2. **No upgrade is mandatory.** A skilled player can full-clear with zero upgrades.
3. **Branch identity matters.** Survival = defensive, Intelligence = information, Profit = snowball economy.
4. **Locked perks create discovery.** Early runs have ~10 perks in the shop pool. Upgrades unlock the other ~5 over time.
5. **Max-out is achievable.** 15-20 runs, not 100. The goal is to feel powerful, then chase leaderboard scores.

---

## 8. SIGINT Narrative

### Operation Names

Each run gets a randomly generated operation name (e.g., "OPERATION: GLASS NEEDLE", "OPERATION: DEAD CIRCUIT"). Generated from two word pools (adjective + noun, both cyber/espionage themed). The operation name becomes the run's identity on the leaderboard.

### Dialogue Moments

| Moment | Content | Delivery |
|--------|---------|----------|
| Run Start | Mission brief, operation name, tone adapts (tutorial for first run, terse for veterans) | Full SIGINT dialogue |
| Floor Briefing | Vague intel about next floor. Reveals gimmick name if SIGNAL INTERCEPT upgrade owned. Reacts to player state (low lives = tense, full lives = confident) | Alongside perk shop |
| Mid-Floor Reactions | Short, punchy. 3-streak: "Nice read." Life lost: "Shake it off." 1 life left: "One more slip and we're dark." Wager win/loss reactions. | Small toast overlay |
| Run Complete (win) | Scales with performance. Clean run = respect. Close call = relief. | Full SIGINT dialogue |
| Run Over (death) | Floor 1 death = sarcastic. Floor 4-5 death = empathetic. Toxic mode = significantly meaner. | Full SIGINT dialogue + stats |

---

## 9. Scoring & Leaderboards

### Run Score Formula

| Component | Points |
|-----------|--------|
| Correct answer | +100 × floor multiplier (1x, 1.5x, 2x, 3x, 4x) |
| Speed bonus (<5s) | +50 |
| Modifier bonus | +25 per active modifier on the card |
| Wrong answer | -50 × floor multiplier |
| Life lost | -100 per death |
| Floor clear | +200 per floor |
| Full clear | +500 |
| No deaths | +300 |
| Longest streak | +20 per card in best streak |

**Theoretical max (perfect run, max modifiers): ~8,000-10,000**
**Realistic good run (full clear, 2 deaths): ~3,500-5,000**

### Leaderboard Tracks

| Track | Metric | Shows |
|-------|--------|-------|
| BEST RUN SCORE | Highest single run score | Score, floor reached, deaths, operation name |
| DEEPEST FLOOR | Highest floor reached | Floor, gimmick name, lives remaining |
| TOTAL CLEARANCE | Lifetime Clearance earned | Total earned, runs completed |

### Leaderboard Tab

Add a "DEADLOCK" tab to the existing leaderboard widget on the home screen (alongside XP, PvP, Daily).

---

## 10. Homepage Integration

**Approach: Priority Stack (Option D)**

Current Stage 4 layout adds roguelike between the PVP/Daily row and Freeplay:

```
[ PVP ]          [ DAILY ]       ← existing row
[ DEADLOCK ]                     ← new, full-width, red border
[ FREEPLAY ]                     ← existing, demoted
Leaderboard tabs (XP | PvP | Daily | Deadlock)
```

- Roguelike button uses `#ff3333` border (red) to visually distinguish from other modes
- Shows best run info: "Floor 4 · 3,240 pts" or "NEW" if never played
- Freeplay stays at the bottom as the low-priority practice mode
- Mobile: all buttons stack vertically (existing behavior)

---

## 11. Cards — Separate Pool

Roguelike cards are **separate from research cards**. They are generated specifically for this mode with:

- Multi-email inbox layouts (TRIAGE gimmick)
- Email chains with injected messages (CHAIN MAIL, BREACH, etc.)
- Lookalike domains with subtle character swaps
- Decoy red flags on legit emails
- Narrative breach/incident sequences (Floor 5 boss scenarios)
- Inspectable elements (hidden URLs, real sender behind display name)
- Confidence wager integration

**No research data is collected from roguelike mode.** This is pure gameplay.

Card pool target: **200+ cards at launch**, expandable with seasonal content.

---

## 12. Data Model (High Level)

### New Tables

- `roguelike_runs` — run records (player_id, operation_name, score, floor_reached, lives_remaining, clearance_earned, perks_purchased, gimmick_assignments, started_at, ended_at)
- `roguelike_upgrades` — player's permanent upgrade state (player_id, upgrade_id, purchased_at)
- `roguelike_cards` — the roguelike-specific card pool (similar to cards_generated but with modifier metadata, inspectable elements, chain data)

### Existing Table Changes

- `players` — add `roguelike_clearance INT DEFAULT 0` column
- `cards_generated` — may extend or use separate `roguelike_cards` table depending on card structure complexity

### Redis

- Roguelike leaderboard sorted sets (same pattern as daily/global leaderboards)
- Run state during active play (lives, intel, perks, floor progress)

---

## 13. Achievements

New roguelike achievement set:

- **FIRST BREACH** — Complete your first run (any floor)
- **TOWER CLEAR** — Clear all 5 floors
- **FLAWLESS** — Full clear with no deaths
- **DEEP POCKETS** — Accumulate 100 Intel in a single run
- **HIGH ROLLER** — Win a 20-Intel confidence wager
- **FULLY LOADED** — Purchase all permanent upgrades
- **SPEED DEMON** — Clear floor 1 in under 30 seconds
- **SURVIVOR** — Clear a floor with 1 life remaining
- **GLASS CANNON** — Full clear with no defensive perks purchased

---

## 14. Implementation Phases

### Phase 1 — Core Loop (MVP)
- Floors 1-3 with 3 Tier 1 gimmicks and 4 Tier 2 gimmicks
- Basic card pool (50-80 cards)
- 5 card modifiers (LOOKALIKE DOMAIN, AI-ENHANCED, TIMED, REDACTED SENDER, DECOY RED FLAGS)
- Intel economy + perk shop (10 perks)
- 3 lives, no permanent upgrades yet
- Basic scoring + leaderboard
- SIGINT run start/end dialogue
- Homepage integration

### Phase 2 — Meta-Progression
- Clearance currency
- All 12 permanent upgrades (3 branches × 4 tiers)
- Locked perks (5 additional perks unlocked via upgrades)
- Upgrade UI screen

### Phase 3 — Full Content
- Floor 5 boss scenarios (BREACH, SUPPLY CHAIN, INSIDER THREAT, APT)
- Remaining card modifiers
- Card pool expansion to 200+
- Full SIGINT dialogue set (mid-floor reactions, floor briefings, death variants)
- Roguelike achievements
- Confidence wager mechanic

### Phase 4 — Polish
- Operation name generator
- Run history / replay
- Seasonal roguelike leaderboard resets
- Additional gimmicks and boss scenarios
