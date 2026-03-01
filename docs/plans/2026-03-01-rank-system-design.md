# Rank System — Design Doc

**Date:** 2026-03-01
**Status:** Approved

## Overview

Players earn a rank based on their efficiency score (total points / 3000 max possible) at the end of each round. Ranks are displayed on the RoundSummary screen and inline next to player names on the global and daily leaderboards.

## Rank Tiers

| Rank | Efficiency | Display Color |
|------|-----------|---------------|
| NOVICE | 0–39% | Dim green (`#00aa28`) |
| OPERATOR | 40–59% | Green (`#00ff41`) |
| ANALYST | 60–74% | Bright green (`#00ff41` + glow) |
| SPECIALIST | 75–89% | Amber (`#ffaa00`) |
| ELITE | 90–100% | Bright amber (`#ffaa00` + glow) |

## Architecture

### `lib/rank.ts`
Pure utility — single exported function:
```typescript
export function getRank(score: number): { label: string; color: string; glow: boolean }
```
- Input: raw score (0–3000)
- Derives efficiency internally: `score / 3000`
- Returns label, Tailwind/hex color, and glow boolean
- No side effects, no state

### `components/RoundSummary.tsx`
- Replace the existing accuracy tier label with the rank badge
- Badge rendered as a styled terminal chip: `[ SPECIALIST ]` in rank color

### `components/StartScreen.tsx`
- Both global and daily leaderboard entries get a rank badge inline next to the name
- Derived on the fly from each entry's score — no extra Redis data needed

## Data Flow

```
score (number) → getRank() → { label, color, glow } → render badge
```

Max possible score is always 3000 (10 cards × 100 pts × 3x confidence multiplier), so rank is always derivable from score alone.

## Scope

- No schema changes — rank is computed, not stored
- No API changes
- 3 files touched: `lib/rank.ts` (new), `components/RoundSummary.tsx`, `components/StartScreen.tsx`
