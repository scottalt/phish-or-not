# DEADLOCK Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance DEADLOCK mode with stacking gimmicks, reactive handler dialogue, technique debrief, streak rewards, perk synergies, INTEL_CACHE fix, floor clear animation, and resume polish.

**Architecture:** Changes span shared definitions (`lib/roguelike.ts`, `lib/roguelike-perks.ts`, `lib/roguelike-gimmicks.ts`), server endpoints (`answer`, `shop`, `next-floor`, finalize), and client components (`RoguelikeRun`, `RoguelikeResult`, `RoguelikeFloorIntro`, `RoguelikePerkShop`). Each task is self-contained and can be committed independently.

**Tech Stack:** Next.js App Router, TypeScript, Redis (Upstash), Supabase, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/roguelike.ts` | Modify | Add `SYNERGY_DEFS`, update `RoguelikeRunState.cardHistory` type, add `floorSecondaryGimmicks` to state |
| `lib/roguelike-perks.ts` | Modify | INTEL_CACHE fix, synergy detection in `applyPerkPurchase`, synergy annotations for shop |
| `lib/roguelike-gimmicks.ts` | Modify | Secondary gimmick assignment logic |
| `app/api/roguelike/[runId]/answer/route.ts` | Modify | Streak milestone rewards, technique tracking in cardHistory, synergy effects (FAILSAFE, MOMENTUM) |
| `app/api/roguelike/[runId]/shop/route.ts` | Modify | Synergy annotations on offerings |
| `app/api/roguelike/[runId]/next-floor/route.ts` | Modify | FORTIFIED synergy (auto-add SHIELD) |
| `app/api/roguelike/[runId]/route.ts` | Modify | Technique breakdown in finalize response |
| `app/api/roguelike/start/route.ts` | Modify | Pass secondary gimmicks in start response |
| `components/RoguelikeRun.tsx` | Modify | Reactive handler dialogue, floor-clear phase, resume polish, secondary gimmick state |
| `components/RoguelikeResult.tsx` | Modify | Technique debrief section |
| `components/RoguelikeFloorIntro.tsx` | Modify | Show secondary gimmick, resume operation name |
| `components/RoguelikePerkShop.tsx` | Modify | Synergy tags on offerings |
| `components/RoguelikeCardDisplay.tsx` | Modify | Apply effects from secondary gimmick |

---

### Task 1: INTEL_CACHE Rebalance

**Files:**
- Modify: `lib/roguelike.ts:296-302` (PERK_DEFS INTEL_CACHE entry)
- Modify: `lib/roguelike-perks.ts:109-111` (applyPerkPurchase INTEL_CACHE effect)

- [ ] **Step 1: Update INTEL_CACHE description and payout**

In `lib/roguelike.ts`, update the INTEL_CACHE perk definition:

```typescript
  {
    id: 'INTEL_CACHE',
    label: 'Intel Cache',
    description: 'Immediately gain 20 Intel.',
    cost: 10,
    stackable: true,
    maxOwned: 2,
  },
```

In `lib/roguelike-perks.ts`, update the immediate effect in `applyPerkPurchase`:

```typescript
  if (perkId === 'INTEL_CACHE') {
    next.intel += 20;
  }
```

- [ ] **Step 2: Build to verify no type errors**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add lib/roguelike.ts lib/roguelike-perks.ts
git commit -m "fix(roguelike): INTEL_CACHE gives 20 instead of 10"
```

---

### Task 2: Synergy Definitions & Detection

**Files:**
- Modify: `lib/roguelike.ts` (add SYNERGY_DEFS after PERK_DEFS)
- Modify: `lib/roguelike-perks.ts` (add synergy helpers, update applyPerkPurchase for COMPOUND_INTEREST)

- [ ] **Step 1: Add synergy definitions to roguelike.ts**

After the `PERK_DEFS` array (after line 303), add:

```typescript
// ─── Perk Synergies ──────────────────────────────────────────────────────────

export interface SynergyDef {
  id: string;
  perkA: PerkId;
  perkB: PerkId;
  name: string;
  description: string;
}

export const SYNERGY_DEFS: SynergyDef[] = [
  {
    id: 'FAILSAFE',
    perkA: 'SHIELD',
    perkB: 'STREAK_SAVER',
    name: 'Failsafe',
    description: 'When either triggers, refund 25% of its cost as Intel.',
  },
  {
    id: 'COMPOUND_INTEREST',
    perkA: 'DOUBLE_INTEL',
    perkB: 'INTEL_CACHE',
    name: 'Compound Interest',
    description: 'Intel Cache gives 25 instead of 20.',
  },
  {
    id: 'MOMENTUM',
    perkA: 'SLOW_TIME',
    perkB: 'STREAK_SAVER',
    name: 'Momentum',
    description: 'Streak intel bonus doubled (+4 instead of +2).',
  },
  {
    id: 'FORTIFIED',
    perkA: 'EXTRA_LIFE',
    perkB: 'SHIELD',
    name: 'Fortified',
    description: 'Start each floor with a free Shield.',
  },
];
```

- [ ] **Step 2: Add synergy helpers to roguelike-perks.ts**

At the top of `lib/roguelike-perks.ts`, add the import and helper:

```typescript
import {
  type PerkId,
  type RoguelikeRunState,
  PERK_DEFS,
  ROGUELIKE_MAX_LIVES,
  SYNERGY_DEFS,
} from './roguelike';
```

After the `hasPerk` function, add:

```typescript
/**
 * Check if a synergy is active (player owns both perks in the pair).
 */
export function hasSynergy(state: RoguelikeRunState, synergyId: string): boolean {
  const def = SYNERGY_DEFS.find((s) => s.id === synergyId);
  if (!def) return false;
  return state.perks.includes(def.perkA) && state.perks.includes(def.perkB);
}

/**
 * Get synergy info for a perk offering (for shop display).
 * Returns the synergy def if the player owns the partner perk.
 */
export function getSynergyForPerk(state: RoguelikeRunState, perkId: PerkId): { name: string; description: string } | null {
  for (const syn of SYNERGY_DEFS) {
    if (syn.perkA === perkId && state.perks.includes(syn.perkB)) {
      return { name: syn.name, description: syn.description };
    }
    if (syn.perkB === perkId && state.perks.includes(syn.perkA)) {
      return { name: syn.name, description: syn.description };
    }
  }
  return null;
}
```

- [ ] **Step 3: Apply COMPOUND_INTEREST in applyPerkPurchase**

In `lib/roguelike-perks.ts`, update the INTEL_CACHE immediate effect:

```typescript
  if (perkId === 'INTEL_CACHE') {
    // COMPOUND_INTEREST synergy: 25 instead of 20 if player also owns DOUBLE_INTEL
    const hasCompound = state.perks.includes('DOUBLE_INTEL');
    next.intel += hasCompound ? 25 : 20;
  }
```

Note: we check `state.perks` (before purchase) since INTEL_CACHE is the one being bought. DOUBLE_INTEL must already be owned.

- [ ] **Step 4: Build to verify**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add lib/roguelike.ts lib/roguelike-perks.ts
git commit -m "feat(roguelike): add perk synergy definitions and detection"
```

---

### Task 3: Synergy Display in Shop

**Files:**
- Modify: `app/api/roguelike/[runId]/shop/route.ts:54-62` (annotate offerings with synergy)
- Modify: `components/RoguelikePerkShop.tsx` (show synergy tags)

- [ ] **Step 1: Annotate offerings with synergy info in shop GET**

In `app/api/roguelike/[runId]/shop/route.ts`, add import:

```typescript
import { getShopOfferings, applyPerkPurchase, getSynergyForPerk } from '@/lib/roguelike-perks';
```

Update the offerings mapping (lines 54-62) to include synergy:

```typescript
    const offerings = offeringIds.map((id) => {
      const def = PERK_DEFS.find((d) => d.id === id);
      if (!def) return null;
      const cost = (state.perkDiscount && state.perkDiscount < 1)
        ? Math.max(0, Math.floor(def.cost * state.perkDiscount))
        : def.cost;
      const synergy = getSynergyForPerk(state, id);
      return { ...def, cost, synergy };
    }).filter(Boolean);
```

- [ ] **Step 2: Update RoguelikePerkShop to show synergy tags**

In `components/RoguelikePerkShop.tsx`, the perk card button renders `def.description`. After the description paragraph (line 155), add synergy display. The `def` object now has an optional `synergy` field from the API.

Update the interface expectations — the `perks` prop receives full perk objects from the parent. Check how perks are passed. Currently perks is `PerkId[]` and defs are looked up locally. The synergy data comes from the API response.

Actually, looking at the current flow: `RoguelikeRun` calls `loadShop()` which gets offerings from the API, but only passes `offeringIds` (PerkId[]) to the shop component. The shop component looks up defs locally from `PERK_DEFS`. We need to pass synergy data through.

Update `RoguelikeRun.tsx` `loadShop` to store synergy data:

Add state in RoguelikeRun:
```typescript
const [shopSynergies, setShopSynergies] = useState<Record<string, { name: string; description: string }>>({});
```

In `loadShop`, after extracting offeringIds:
```typescript
      // Extract synergy data keyed by perk ID
      const synergies: Record<string, { name: string; description: string }> = {};
      for (const p of data.offerings ?? []) {
        if (typeof p === 'object' && p.synergy) {
          synergies[p.id] = p.synergy;
        }
      }
      setShopSynergies(synergies);
```

Pass to shop component:
```typescript
      <RoguelikePerkShop
        ...existing props...
        synergies={shopSynergies}
      />
```

In `RoguelikePerkShop.tsx`, add to Props:
```typescript
  synergies?: Record<string, { name: string; description: string }>;
```

In the perk card render, after the description paragraph:
```typescript
              {synergies?.[perkId] && (
                <p className="text-[10px] tracking-widest" style={{ color: '#ffaa00' }}>
                  SYNERGY: {synergies[perkId].name} — {synergies[perkId].description}
                </p>
              )}
```

- [ ] **Step 3: Build to verify**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/api/roguelike/[runId]/shop/route.ts components/RoguelikePerkShop.tsx components/RoguelikeRun.tsx
git commit -m "feat(roguelike): show synergy tags in perk shop"
```

---

### Task 4: Synergy Effects in Answer Endpoint

**Files:**
- Modify: `app/api/roguelike/[runId]/answer/route.ts` (FAILSAFE refund, MOMENTUM streak bonus)

- [ ] **Step 1: Add synergy import**

```typescript
import { hasPerk } from '@/lib/roguelike-perks';
import { hasSynergy } from '@/lib/roguelike-perks';
```

(Combine into single import line)

- [ ] **Step 2: Add FAILSAFE synergy effect**

After the SHIELD consumption block (around line 156), add a refund if FAILSAFE is active:

```typescript
      if (hasPerk(state, 'SHIELD')) {
        const shieldIdx = state.perks.indexOf('SHIELD');
        state = { ...state, perks: state.perks.filter((_, i) => i !== shieldIdx), usedDefensivePerk: true };
        // FAILSAFE synergy: refund 25% of SHIELD cost (35 * 0.25 = 8)
        if (hasSynergy(state, 'FAILSAFE')) {
          intelDelta += 8;
        }
      }
```

Similarly, after STREAK_SAVER consumption (around line 143):

```typescript
      state = { ...state, perks: state.perks.filter((_, i) => i !== saverIdx), usedDefensivePerk: true };
      // FAILSAFE synergy: refund 25% of STREAK_SAVER cost (18 * 0.25 = 4)
      if (hasSynergy(state, 'FAILSAFE')) {
        intelDelta += 4;
      }
```

Note: `intelDelta` is declared later in the current code (line 164). We need to move the FAILSAFE refund to after intelDelta is computed. Instead, track a `synergyRefund` variable:

After line 133 (`let streakBroken = !correct && state.streak > 0;`), add:
```typescript
    let synergyRefund = 0;
```

In STREAK_SAVER block, add:
```typescript
      if (hasSynergy(state, 'FAILSAFE')) synergyRefund += 4;
```

In SHIELD block, add:
```typescript
        if (hasSynergy(state, 'FAILSAFE')) synergyRefund += 8;
```

Then at line 205 where newIntel is calculated:
```typescript
    const newIntel = Math.max(0, state.intel + intelDelta + wagerDelta + synergyRefund);
```

- [ ] **Step 3: Add MOMENTUM synergy effect**

In the streak bonus calculation (line 193), currently:
```typescript
      intelDelta += calculateStreakIntel(newStreak, INTEL_STREAK_MIN);
```

Replace with:
```typescript
      let streakIntel = calculateStreakIntel(newStreak, INTEL_STREAK_MIN);
      // MOMENTUM synergy: double streak intel bonus
      if (streakIntel > 0 && hasSynergy(state, 'MOMENTUM')) {
        streakIntel *= 2;
      }
      intelDelta += streakIntel;
```

- [ ] **Step 4: Build to verify**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add app/api/roguelike/[runId]/answer/route.ts
git commit -m "feat(roguelike): FAILSAFE and MOMENTUM synergy effects"
```

---

### Task 5: FORTIFIED Synergy in next-floor

**Files:**
- Modify: `app/api/roguelike/[runId]/next-floor/route.ts:133-140` (auto-add SHIELD)

- [ ] **Step 1: Add FORTIFIED effect**

Add import at top:
```typescript
import { hasSynergy } from '@/lib/roguelike-perks';
```

After building `updatedState` (line 134-140), before storing in Redis, check for FORTIFIED:

```typescript
    // FORTIFIED synergy: auto-add SHIELD at start of each floor
    if (hasSynergy(updatedState, 'FORTIFIED') && !updatedState.perks.includes('SHIELD')) {
      updatedState = { ...updatedState, perks: [...updatedState.perks, 'SHIELD'] };
    }
```

- [ ] **Step 2: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add app/api/roguelike/[runId]/next-floor/route.ts
git commit -m "feat(roguelike): FORTIFIED synergy auto-adds SHIELD each floor"
```

---

### Task 6: Streak Milestone Rewards

**Files:**
- Modify: `app/api/roguelike/[runId]/answer/route.ts` (streak milestones at 5 and 10)

- [ ] **Step 1: Add streak milestone rewards after streak update**

After the streak update logic and before intel calculation, add milestone tracking. We need to return the milestone info to the client.

After `const newBestStreak = Math.max(state.bestStreak, newStreak);` (line 146), add:

```typescript
    // ── Streak milestone rewards ──
    let streakMilestone: { type: 'intel' | 'life'; amount: number } | null = null;
```

After intelDelta calculation (before the wager section, around line 196), add:

```typescript
    // Streak milestones (only trigger on the exact streak count)
    if (correct && newStreak === 5) {
      intelDelta += 5;
      streakMilestone = { type: 'intel', amount: 5 };
    } else if (correct && newStreak === 10) {
      if (newLives < state.maxLives) {
        newLives += 1;
        streakMilestone = { type: 'life', amount: 1 };
      } else {
        intelDelta += 10;
        streakMilestone = { type: 'intel', amount: 10 };
      }
    }
```

Note: `newLives` was set at line 149-161. For the 10-streak life reward, we're incrementing it here. Need to make sure `finalLives` picks it up — it's set from `newLives` at line 218. This is fine since we're modifying `newLives` before that.

Add `streakMilestone` to the response:

```typescript
    return NextResponse.json({
      ...existing fields...
      streakMilestone,
    });
```

- [ ] **Step 2: Show streak milestone toast on client**

In `components/RoguelikeRun.tsx`, in the answer response handler (around line 464-510), after the existing SIGINT toast logic, add:

```typescript
      // Streak milestone toasts
      if (data.streakMilestone) {
        if (data.streakMilestone.type === 'life') {
          showToast('+1 LIFE — STREAK REWARD');
        } else {
          showToast(`+${data.streakMilestone.amount} INTEL — STREAK BONUS`);
        }
      }
```

- [ ] **Step 3: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add app/api/roguelike/[runId]/answer/route.ts components/RoguelikeRun.tsx
git commit -m "feat(roguelike): streak milestone rewards at 5 and 10"
```

---

### Task 7: Stacking Gimmicks

**Files:**
- Modify: `lib/roguelike.ts:307-338` (add `floorSecondaryGimmicks` to RoguelikeRunState)
- Modify: `lib/roguelike-gimmicks.ts` (return secondary gimmicks)
- Modify: `app/api/roguelike/start/route.ts` (pass secondary gimmicks)
- Modify: `app/api/roguelike/[runId]/next-floor/route.ts` (pass secondary gimmick)
- Modify: `components/RoguelikeRun.tsx` (track and apply secondary gimmick)
- Modify: `components/RoguelikeFloorIntro.tsx` (show secondary gimmick)
- Modify: `components/RoguelikeCardDisplay.tsx` (apply secondary effects)

- [ ] **Step 1: Add secondary gimmick to state type**

In `lib/roguelike.ts`, in `RoguelikeRunState`, after `floorGimmicks`:

```typescript
  floorGimmicks: (GimmickId | null)[];
  floorSecondaryGimmicks?: (GimmickId | null)[];  // secondary modifiers for floors 2+
```

- [ ] **Step 2: Update assignGimmicks to return secondary gimmicks**

In `lib/roguelike-gimmicks.ts`, update the function signature and logic:

```typescript
/** Allowed secondary gimmicks — lighter modifiers that layer well */
const SECONDARY_GIMMICKS: GimmickId[] = ['UNDER_PRESSURE', 'DECEPTION', 'CHAIN_MAIL'];

interface GimmickAssignment {
  primary: (GimmickId | null)[];
  secondary: (GimmickId | null)[];
}

export function assignGimmicks(floorCount: number = ROGUELIKE_FLOORS): GimmickAssignment {
  const tier1 = shuffle([...TIER1_GIMMICKS]);
  const tier2 = shuffle([...TIER2_GIMMICKS]);
  const tier3 = shuffle([...TIER3_GIMMICKS]);

  const primary: (GimmickId | null)[] = [];
  const secondary: (GimmickId | null)[] = [];

  // Floor 0: Tier 1, no secondary
  primary.push(tier1[0] ?? null);
  secondary.push(null);

  // Floors 1 through floorCount-2: Tier 2
  const tier2Count = Math.min(floorCount - 2, tier2.length);
  const shuffledSecondary = shuffle([...SECONDARY_GIMMICKS]);
  let secondaryIdx = 0;

  for (let i = 0; i < tier2Count; i++) {
    const floorIdx = i + 1;
    primary.push(tier2[i] ?? null);

    if (floorIdx >= 2) {
      // Floors 2+ get a secondary, but not the same as the primary
      let sec = shuffledSecondary[secondaryIdx] ?? null;
      if (sec === tier2[i]) {
        secondaryIdx++;
        sec = shuffledSecondary[secondaryIdx] ?? null;
      }
      secondary.push(sec);
      secondaryIdx++;
    } else {
      secondary.push(null);
    }
  }

  // Last floor: Tier 3 (boss), no secondary
  if (floorCount >= 5 && tier3.length > 0) {
    primary.push(tier3[0] ?? null);
    secondary.push(null);
  }

  return { primary, secondary };
}
```

- [ ] **Step 3: Update start endpoint**

In `app/api/roguelike/start/route.ts`, the call to `assignGimmicks` currently returns a flat array. Update:

```typescript
    const { primary: floorGimmicks, secondary: floorSecondaryGimmicks } = assignGimmicks(ROGUELIKE_FLOORS);
```

Add `floorSecondaryGimmicks` to the state object and the response:

In state (line ~207):
```typescript
      floorGimmicks,
      floorSecondaryGimmicks,
```

In the response:
```typescript
      gimmick: floorGimmicks[0] ?? null,
      secondaryGimmick: floorSecondaryGimmicks[0] ?? null,
```

- [ ] **Step 4: Update next-floor endpoint**

In `app/api/roguelike/[runId]/next-floor/route.ts`, update gimmick lookup:

```typescript
    const nextGimmick = state.floorGimmicks[nextFloor] ?? null;
    const nextSecondaryGimmick = state.floorSecondaryGimmicks?.[nextFloor] ?? null;
```

Include in response:
```typescript
      secondaryGimmick: nextSecondaryGimmick,
```

- [ ] **Step 5: Track secondary gimmick in RoguelikeRun**

In `components/RoguelikeRun.tsx`, add state:

```typescript
  const [secondaryGimmick, setSecondaryGimmick] = useState<GimmickId | null>(null);
```

In `startRun` response handler, after `setGimmick`:
```typescript
        setSecondaryGimmick(data.secondaryGimmick ?? null);
```

In `advanceToNextFloor`, after setting gimmick:
```typescript
        setSecondaryGimmick(data.secondaryGimmick ?? null);
```

Pass `secondaryGimmick` to `RoguelikeCardDisplay` and `RoguelikeFloorIntro`.

- [ ] **Step 6: Update RoguelikeFloorIntro to show secondary gimmick**

In `components/RoguelikeFloorIntro.tsx`, add `secondaryGimmick` prop:

```typescript
interface FloorIntroProps {
  floor: number;
  gimmick: GimmickId | null;
  secondaryGimmick?: GimmickId | null;
  resumeOperationName?: string | null;
  onSkip: () => void;
}
```

After the primary gimmick description, add:

```typescript
        {secondaryGimmick && GIMMICK_DEFS[secondaryGimmick] && (
          <>
            <p className="text-xs text-[var(--c-muted)] tracking-widest mt-2">+</p>
            <p
              className="text-sm font-bold tracking-widest"
              style={{ color: '#ffaa00' }}
            >
              {GIMMICK_DEFS[secondaryGimmick].label.toUpperCase()}
            </p>
            <p className="text-xs text-[var(--c-muted)] max-w-xs">
              {GIMMICK_DEFS[secondaryGimmick].description}
            </p>
          </>
        )}
```

- [ ] **Step 7: Apply secondary gimmick effects in RoguelikeCardDisplay**

In `components/RoguelikeCardDisplay.tsx`, add `secondaryGimmick` prop and apply its effects. The secondary gimmick uses the same rendering logic as the primary — check both `gimmick` and `secondaryGimmick` for timer/UI effects.

For timers, in `RoguelikeRun.tsx` where `timerDurationMs` is computed, also check `secondaryGimmick`:

```typescript
  const timerDurationMs = useMemo(() => {
    const primaryTimer = getTimerDuration(gimmick, floor);
    const secondaryTimer = getTimerDuration(secondaryGimmick, floor);
    // Use whichever timer is active (secondary takes priority if both somehow have timers)
    const baseMs = secondaryTimer ?? primaryTimer;
    if (baseMs === null) return null;
    // ... existing SLOW_TIME logic
  }, [gimmick, secondaryGimmick, ...]);
```

- [ ] **Step 8: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add lib/roguelike.ts lib/roguelike-gimmicks.ts app/api/roguelike/start/route.ts app/api/roguelike/[runId]/next-floor/route.ts components/RoguelikeRun.tsx components/RoguelikeFloorIntro.tsx components/RoguelikeCardDisplay.tsx
git commit -m "feat(roguelike): stacking gimmicks on floors 2-3"
```

---

### Task 8: Technique Tracking in cardHistory

**Files:**
- Modify: `lib/roguelike.ts:322` (update cardHistory type)
- Modify: `app/api/roguelike/[runId]/answer/route.ts:209` (push full entry)
- Modify: `app/api/roguelike/[runId]/route.ts` (aggregate technique breakdown in finalize)

- [ ] **Step 1: Update cardHistory type**

In `lib/roguelike.ts`, change:

```typescript
  cardHistory: string[];      // cardIds answered so far
```

to:

```typescript
  cardHistory: (string | { cardId: string; technique: string | null; correct: boolean; isPhishing: boolean })[];
```

This union type handles backward compatibility — old runs have strings, new runs have objects.

- [ ] **Step 2: Update answer endpoint to push rich entry**

In `app/api/roguelike/[runId]/answer/route.ts`, change line 209:

```typescript
    const newCardHistory = [...state.cardHistory, currentCardId];
```

to:

```typescript
    const newCardHistory = [...state.cardHistory, {
      cardId: currentCardId,
      technique: card.technique ?? null,
      correct,
      isPhishing: card.isPhishing,
    }];
```

- [ ] **Step 3: Add technique breakdown to finalize**

In `app/api/roguelike/[runId]/route.ts`, in the PATCH handler, before the final response (around line 286), compute technique breakdown:

```typescript
    // ── Technique breakdown for debrief ──
    const techMap = new Map<string, { seen: number; caught: number; missed: number }>();
    for (const entry of state.cardHistory) {
      if (typeof entry === 'string') continue; // old format, skip
      if (!entry.isPhishing || !entry.technique) continue; // only track phishing techniques
      const t = techMap.get(entry.technique) ?? { seen: 0, caught: 0, missed: 0 };
      t.seen++;
      if (entry.correct) t.caught++;
      else t.missed++;
      techMap.set(entry.technique, t);
    }
    const techniqueBreakdown = Array.from(techMap.entries())
      .map(([technique, stats]) => ({ technique, ...stats }))
      .sort((a, b) => b.seen - a.seen);
```

Add to response:
```typescript
      techniqueBreakdown,
```

- [ ] **Step 4: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add lib/roguelike.ts app/api/roguelike/[runId]/answer/route.ts app/api/roguelike/[runId]/route.ts
git commit -m "feat(roguelike): track technique in cardHistory + debrief breakdown"
```

---

### Task 9: Technique Debrief in Result Screen

**Files:**
- Modify: `components/RoguelikeResult.tsx` (add technique analysis section)
- Modify: `components/RoguelikeRun.tsx` (pass technique data to result)

- [ ] **Step 1: Add techniqueBreakdown to RoguelikeResult props**

In `components/RoguelikeResult.tsx`, add to Props:

```typescript
  techniqueBreakdown?: { technique: string; seen: number; caught: number; missed: number }[];
```

- [ ] **Step 2: Add technique analysis section**

After the achievements section and before the floor breakdown, add:

```typescript
      {/* Technique analysis */}
      {techniqueBreakdown && techniqueBreakdown.length > 0 && (
        <div
          className="w-full term-border anim-fade-in-up"
          style={{ animationDelay: '400ms', animationFillMode: 'both' }}
        >
          <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_25%,transparent)] px-3 py-1.5">
            <span className="text-xs text-[var(--c-secondary)] tracking-widest">THREAT ANALYSIS</span>
          </div>
          <div className="divide-y divide-[color-mix(in_srgb,var(--c-primary)_10%,transparent)]">
            {techniqueBreakdown.map((t) => {
              const rate = t.seen > 0 ? Math.round((t.caught / t.seen) * 100) : 0;
              const isWorst = techniqueBreakdown.length > 1 && rate === Math.min(...techniqueBreakdown.map((x) => x.seen > 0 ? Math.round((x.caught / x.seen) * 100) : 100));
              const barWidth = t.seen > 0 ? (t.caught / t.seen) * 100 : 0;
              return (
                <div key={t.technique} className="px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--c-secondary)] uppercase tracking-wider">
                      {t.technique.replace(/_/g, ' ')}
                    </span>
                    <span className="tabular-nums flex items-center gap-2">
                      <span style={{ color: isWorst ? '#ff3333' : 'var(--c-primary)' }}>
                        {t.caught}/{t.seen} {rate}%
                      </span>
                      {isWorst && (
                        <span className="text-[10px] tracking-widest" style={{ color: '#ff3333' }}>
                          WEAK SPOT
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--c-dark)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        background: isWorst ? '#ff3333' : 'var(--c-primary)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
```

- [ ] **Step 3: Pass technique data from RoguelikeRun to RoguelikeResult**

In `components/RoguelikeRun.tsx`, update the `ResultData` interface:

```typescript
interface ResultData {
  finalScore: number;
  clearanceEarned: number;
  floorsCleared: number;
  deaths: number;
  bestStreak: number;
  cardsAnswered: number;
  cardsCorrect: number;
  status: string;
  operationName: string;
  newAchievements?: string[];
  xpEarned?: number;
  techniqueBreakdown?: { technique: string; seen: number; caught: number; missed: number }[];
}
```

In the `RoguelikeResult` render, pass it:

```typescript
        techniqueBreakdown={resultData.techniqueBreakdown}
```

- [ ] **Step 4: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add components/RoguelikeResult.tsx components/RoguelikeRun.tsx
git commit -m "feat(roguelike): technique debrief in post-run result screen"
```

---

### Task 10: Reactive Handler Dialogue

**Files:**
- Modify: `components/RoguelikeRun.tsx` (replace simple streak toasts with pattern-based reactive lines)

- [ ] **Step 1: Add reactive dialogue tracking state**

In `RoguelikeRun.tsx`, add state near other run state declarations:

```typescript
  // ── Reactive handler dialogue state ──
  const [missedPhishingStreak, setMissedPhishingStreak] = useState(0);
  const [falsePositiveStreak, setFalsePositiveStreak] = useState(0);
  const [fastAnswerStreak, setFastAnswerStreak] = useState(0);
  const lastReactiveCard = useRef(-1);
```

- [ ] **Step 2: Define reactive line pools**

Add the line definitions (can go near the existing STREAK_3_TOASTS):

```typescript
      // ── Reactive handler dialogue ──
      const REACTIVE_LINES = {
        clutch: [
          "Nerves of steel. Barely.",
          "One life and still standing. Impressive.",
          "That was too close. But you made it.",
        ],
        floorPerfect: [
          "Clean sweep. That's how it's done.",
          "Flawless floor. Don't let it go to your head.",
          "Perfect reads. Every single one.",
        ],
        hotStreak: [
          "Sharp. Keep that up.",
          "You're locked in. I can tell.",
          "Razor sharp. Don't get cocky.",
        ],
        overconfidence: [
          "Confidence without accuracy is a liability.",
          "That was a CERTAIN? Recalibrate.",
          "Overconfidence kills operations. Literally.",
        ],
        missingPhishing: [
          "You're letting threats through. Slow down.",
          "Three slipped past. Tighten the filter.",
          "Threats are getting through. Reassess.",
        ],
        falsePositives: [
          "Not everything's a threat. You're jumping at shadows.",
          "Ease up. Real analysts don't flag everything.",
          "Too many false alarms. Trust the signals.",
        ],
        speedDemon: [
          "Fast hands. Hope the brain's keeping up.",
          "Speed's good. Accuracy's better.",
          "Slow down. This isn't a race.",
        ],
      } as const;

      const pickLine = (pool: readonly string[]) =>
        pool[Math.floor(Math.random() * pool.length)];
```

- [ ] **Step 3: Replace existing SIGINT toast logic**

Replace the entire existing SIGINT mid-floor reactions block (lines 465-510) with:

```typescript
      // ── Update reactive tracking ──
      if (!data.correct && data.isPhishing) {
        setMissedPhishingStreak((s) => s + 1);
        setFalsePositiveStreak(0);
      } else if (!data.correct && !data.isPhishing) {
        setFalsePositiveStreak((s) => s + 1);
        setMissedPhishingStreak(0);
      } else {
        setMissedPhishingStreak(0);
        setFalsePositiveStreak(0);
      }
      if (timeFromRenderMs < 3000) {
        setFastAnswerStreak((s) => s + 1);
      } else {
        setFastAnswerStreak(0);
      }

      // ── Fire reactive handler lines (priority order, cooldown of 3 cards) ──
      const canFire = cardIndex - lastReactiveCard.current >= 3 || lastReactiveCard.current === -1;
      if (canFire) {
        let fired = false;

        // Priority 1: Clutch (correct at 1 life)
        if (!fired && data.correct && data.lives === 1) {
          triggerCustom([pickLine(REACTIVE_LINES.clutch)], 'COPY');
          lastReactiveCard.current = cardIndex;
          fired = true;
        }

        // Priority 2: Floor perfect (all correct on floor)
        if (!fired && data.floorCleared && data.correct) {
          // Check if all answers on this floor were correct (streak >= CARDS_PER_FLOOR means no wrongs)
          const floorAllCorrect = data.streak >= ROGUELIKE_CARDS_PER_FLOOR || (cardIndex === ROGUELIKE_CARDS_PER_FLOOR - 1 && data.streak >= ROGUELIKE_CARDS_PER_FLOOR);
          if (floorAllCorrect) {
            triggerCustom([pickLine(REACTIVE_LINES.floorPerfect)], 'COPY');
            lastReactiveCard.current = cardIndex;
            fired = true;
          }
        }

        // Priority 3: Hot streak (5+)
        if (!fired && data.correct && data.streak >= 5) {
          triggerCustom([pickLine(REACTIVE_LINES.hotStreak)], 'COPY');
          lastReactiveCard.current = cardIndex;
          fired = true;
        }

        // Priority 4: Overconfidence (CERTAIN wager on wrong answer)
        if (!fired && !data.correct && wager && wager >= 15) {
          triggerCustom([pickLine(REACTIVE_LINES.overconfidence)], 'COPY');
          lastReactiveCard.current = cardIndex;
          fired = true;
        }

        // Priority 5: Missing phishing (3+ in a row)
        if (!fired && missedPhishingStreak >= 3) {
          triggerCustom([pickLine(REACTIVE_LINES.missingPhishing)], 'COPY');
          lastReactiveCard.current = cardIndex;
          fired = true;
        }

        // Priority 6: False positives (3+ in a row)
        if (!fired && falsePositiveStreak >= 3) {
          triggerCustom([pickLine(REACTIVE_LINES.falsePositives)], 'COPY');
          lastReactiveCard.current = cardIndex;
          fired = true;
        }

        // Priority 7: Speed demon (3+ fast answers)
        if (!fired && fastAnswerStreak >= 3) {
          triggerCustom([pickLine(REACTIVE_LINES.speedDemon)], 'COPY');
          lastReactiveCard.current = cardIndex;
          fired = true;
        }

        // Fallback: floor clear toast (not a "reactive" line, always fires)
        if (!fired && data.floorCleared) {
          const FLOOR_CLEAR_TOASTS = [
            "Floor cleared. Requisition incoming.",
            "Sector clear. Moving up.",
            "Good work. Resupply ahead.",
          ];
          triggerCustom([pickLine(FLOOR_CLEAR_TOASTS)], 'COPY');
        }

        // Fallback: life lost
        if (!fired && !data.correct) {
          const liveLost = data.lives < lives;
          if (liveLost) {
            if (data.lives === 1) {
              const LAST_LIFE = ["One more slip and we're dark.", "Final life. Every call matters now.", "Critical status. Focus."];
              triggerCustom([pickLine(LAST_LIFE)], 'COPY');
            } else {
              const LIFE_LOST = ["Shake it off. Stay focused.", "That one was tricky. Regroup.", "Damage taken. Keep moving."];
              triggerCustom([pickLine(LIFE_LOST)], 'COPY');
            }
          }
        }
      }
```

Note: The `isPhishing` field is already returned from the answer endpoint (line 265). The `wager` variable is available in scope from the answer submission. `ROGUELIKE_CARDS_PER_FLOOR` needs to be imported — check it's already imported.

- [ ] **Step 4: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add components/RoguelikeRun.tsx
git commit -m "feat(roguelike): reactive handler dialogue replaces simple streak toasts"
```

---

### Task 11: Floor Clear Animation

**Files:**
- Modify: `components/RoguelikeRun.tsx` (add floor-clear phase and render)

- [ ] **Step 1: Add floor-clear phase handling**

The `Phase` type already includes `'floor-clear'` (we need to add it — it was only added as a concept but not to the type yet).

Wait — the current Phase type is:
```typescript
type Phase = 'lobby' | 'loading' | 'floor' | 'feedback' | 'shop' | 'result' | 'floor-intro' | 'wager' | 'upgrades' | 'paused-prompt';
```

Add `'floor-clear'`:
```typescript
type Phase = 'lobby' | 'loading' | 'floor' | 'feedback' | 'shop' | 'result' | 'floor-intro' | 'wager' | 'upgrades' | 'paused-prompt' | 'floor-clear';
```

- [ ] **Step 2: Trigger floor-clear phase after last card feedback**

In `RoguelikeRun.tsx`, find where floor completion transitions to shop. Currently, in the feedback phase timeout handler, when `floorCleared` is true, it calls `loadShop`. We need to intercept this and show the floor-clear animation first.

Find the feedback auto-advance logic. It should be around the feedback phase render or in a useEffect. Look for where `feedbackData.floorCleared` triggers `loadShop`.

The feedback timeout is in the answer handler. After setting feedback data:

```typescript
      setFeedbackData(data);
      setPendingAnswer(null);
      setPhase('feedback');

      // Auto-advance after feedback display
      feedbackTimeoutRef.current = setTimeout(() => {
```

In the feedback timeout, if `data.floorCleared`, instead of calling `loadShop`, set phase to `'floor-clear'`:

Find and update the feedback timeout to check for floor clear:

```typescript
        if (data.status === 'dead') {
          // ... death handling
        } else if (data.floorCleared) {
          setPhase('floor-clear');
        } else {
          // advance to next card
        }
```

- [ ] **Step 3: Add floor-clear render block**

After the `'paused-prompt'` render and before `'floor-intro'`, add:

```typescript
  // ── Render: floor clear animation ──
  if (phase === 'floor-clear') {
    return (
      <div
        onClick={() => { if (runId) loadShop(runId); }}
        className="flex flex-col items-center justify-center gap-4 p-8 font-mono min-h-[300px] cursor-pointer select-none"
      >
        <div className="anim-floor-intro text-center space-y-3">
          <p
            className="text-3xl font-black tracking-widest"
            style={{
              color: '#00ff41',
              textShadow: '0 0 12px #00ff41, 0 0 30px rgba(0,255,65,0.3)',
            }}
          >
            FLOOR {floor + 1} CLEARED
          </p>
          <p className="text-sm text-[var(--c-secondary)] tabular-nums">
            SCORE: {score.toLocaleString()}
          </p>
        </div>
        <p className="text-[var(--c-muted)] text-xs mt-4 animate-pulse">TAP TO CONTINUE</p>
      </div>
    );
  }
```

Add auto-dismiss timer — when entering floor-clear phase, set a timeout:

```typescript
  // Auto-dismiss floor clear after 1.5s
  useEffect(() => {
    if (phase !== 'floor-clear' || !runId) return;
    const timer = setTimeout(() => loadShop(runId), 1500);
    return () => clearTimeout(timer);
  }, [phase, runId]);
```

- [ ] **Step 4: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add components/RoguelikeRun.tsx
git commit -m "feat(roguelike): floor clear animation between floor and shop"
```

---

### Task 12: Resume Operation Name Polish

**Files:**
- Modify: `components/RoguelikeRun.tsx` (track resumed flag)
- Modify: `components/RoguelikeFloorIntro.tsx` (show resume message)

- [ ] **Step 1: Track resumed state**

In `RoguelikeRun.tsx`, add state:

```typescript
  const [isResumed, setIsResumed] = useState(false);
```

In `handleResume`, before `loadShop`:

```typescript
      setIsResumed(true);
```

- [ ] **Step 2: Pass to floor intro and clear after intro**

When rendering `RoguelikeFloorIntro`, pass `resumeOperationName`:

```typescript
        <RoguelikeFloorIntro
          floor={floor}
          gimmick={floorIntroGimmick}
          secondaryGimmick={secondaryGimmick}
          resumeOperationName={isResumed ? operationName : null}
          onSkip={() => {
            if (floorIntroTimeoutRef.current) clearTimeout(floorIntroTimeoutRef.current);
            setIsResumed(false);
            setPhase('floor');
          }}
        />
```

- [ ] **Step 3: Show resume message in floor intro**

In `RoguelikeFloorIntro.tsx`, before the "TAP TO START" text:

```typescript
        {resumeOperationName && (
          <p
            className="text-xs tracking-widest"
            style={{ color: '#ffaa00' }}
          >
            RESUMING: {resumeOperationName}
          </p>
        )}
```

- [ ] **Step 4: Build and commit**

```bash
npx next build 2>&1 | tail -5
git add components/RoguelikeRun.tsx components/RoguelikeFloorIntro.tsx
git commit -m "feat(roguelike): show operation name when resuming paused run"
```

---

### Task 13: Final Integration Build & Push

- [ ] **Step 1: Full build verification**

```bash
npx next build 2>&1 | tail -15
```

- [ ] **Step 2: Push to master**

```bash
git push origin v2.1:master
```
