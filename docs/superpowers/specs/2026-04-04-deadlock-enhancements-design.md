# DEADLOCK Enhancements Design

**Date:** 2026-04-04
**Status:** Approved

## Overview

Eight enhancements to the DEADLOCK roguelike mode: stacking gimmicks, reactive handler dialogue, post-run technique debrief, streak milestone rewards, perk synergies, INTEL_CACHE rebalance, floor clear animation, and resume polish.

---

## 1. Perk Economy & Synergies

### INTEL_CACHE Rebalance
- Cost: 10 intel, gives **20 intel** (up from 10). Net +10 per buy.
- Stackable x2, max owned unchanged.

### Streak Milestone Rewards
- **5-streak:** +5 intel bonus. Toast: "+5 INTEL — STREAK BONUS"
- **10-streak:** +1 life (if below max), otherwise +10 intel. Toast: "+1 LIFE — STREAK REWARD" or "+10 INTEL"
- Triggered in answer endpoint, returned to client alongside normal feedback.

### Perk Synergies

| Pair | Synergy Name | Effect |
|------|-------------|--------|
| SHIELD + STREAK_SAVER | FAILSAFE | When either triggers, refund 25% of its cost as intel |
| DOUBLE_INTEL + INTEL_CACHE | COMPOUND INTEREST | INTEL_CACHE gives 25 instead of 20 |
| SLOW_TIME + STREAK_SAVER | MOMENTUM | Streak intel bonus doubled (+4 instead of +2) |
| EXTRA_LIFE + SHIELD | FORTIFIED | Start next floor with a free SHIELD |

**Discovery:** Synergies revealed in shop. If you own one half, the partner perk shows a "SYNERGY" tag with the bonus described. Activates on purchase of second perk.

**Implementation:**
- `SYNERGY_DEFS` array in `lib/roguelike.ts`
- Answer endpoint checks active synergies when applying perk effects
- Shop endpoint annotates offerings with synergy info
- FORTIFIED applied in `next-floor` endpoint (auto-add SHIELD to perks)

---

## 2. Stacking Gimmicks

### Rules
- Floors 0-1: Single gimmick (unchanged)
- Floor 2: Primary gimmick + one secondary modifier
- Floor 3: Primary gimmick + one secondary modifier (different from floor 2's)
- Floor 4 (boss): Boss gimmick only, no stacking

### Allowed Secondary Modifiers
| Secondary | Effect |
|-----------|--------|
| UNDER_PRESSURE | Timer |
| DECEPTION | Extra modifier cards |
| CHAIN_MAIL | Previous answer affects next |

### Blocked Combinations
- No two UI-transform gimmicks (BLACKOUT + TRIAGE, BLACKOUT + INVESTIGATION)
- No two timer gimmicks (QUICK_SCAN + UNDER_PRESSURE)
- Boss gimmicks never stack

### Data Model
- Add `floorSecondaryGimmicks: (GimmickId | null)[]` to `RoguelikeRunState`
- `assignGimmicks` returns both primary and secondary arrays
- Floor intro and HUD show both gimmick names
- Shop "next floor intel" shows both if player has SIGNAL_INTERCEPT

---

## 3. Reactive Handler Dialogue

Pattern detection runs client-side in `RoguelikeRun.tsx` after each answer. Uses `triggerCustom()`. Replaces current streak toasts. Cooldown: 3 cards between reactive lines. One line per answer max.

### Pattern Priority (highest first)

| Priority | Pattern | Trigger | Example Lines |
|----------|---------|---------|---------------|
| 1 | Clutch | Correct at 1 life | "Nerves of steel. Barely." |
| 2 | Floor perfect | 5/5 correct on floor | "Clean sweep. That's how it's done." |
| 3 | Hot streak | 5+ streak | "Sharp. Keep that up." |
| 4 | Overconfidence | CERTAIN wager on wrong | "Confidence without accuracy is a liability." |
| 5 | Missing phishing | 3+ phishing missed in row | "You're letting threats through. Slow down." |
| 6 | False positives | 3+ legit flagged phishing | "Not everything's a threat. Jumping at shadows." |
| 7 | Speed demon | 3+ answers under 3s | "Fast hands. Hope the brain's keeping up." |

### Tracking State (component-level, not persisted)
- `missedPhishingStreak` — consecutive phishing emails got wrong
- `falsePositiveStreak` — consecutive legit emails marked phishing
- `lastReactiveLine` — card index of last fired line (cooldown)

No server changes needed.

---

## 4. Post-Run Technique Debrief

### Data Model Change
`cardHistory` in `RoguelikeRunState`: `string[]` → `{ cardId: string; technique: string; correct: boolean; isPhishing: boolean }[]`

Backward compatibility: if existing Redis state has string array (old format), treat as no technique data.

### Finalize Response Addition
```typescript
techniqueBreakdown: {
  technique: string;
  seen: number;
  caught: number;
  missed: number;
}[]
```

### UI in RoguelikeResult
New "THREAT ANALYSIS" section between stats grid and floor breakdown. Bar chart showing catch rate per phishing technique. Worst technique highlighted in red with "WEAK SPOT" tag. Only phishing techniques shown (legit emails excluded).

---

## 5. Visual Polish

### Floor Clear Animation
- New phase `'floor-clear'` between last feedback and shop
- Full-screen overlay: "FLOOR {n} CLEARED" with scan-line sweep (800ms)
- `playFloorClear()` sound (already exists)
- Auto-dismiss after 1.5s or tap to skip
- Inline render block in RoguelikeRun, no new component file

### Resume Operation Name
- Track `resumed: boolean` in component state
- Floor intro shows "RESUMING OPERATION: {name}" when coming back from pause
- Flag cleared after floor intro completes
