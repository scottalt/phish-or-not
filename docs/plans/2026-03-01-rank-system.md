# Rank System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a rank badge (NOVICE → ELITE) based on efficiency score on the RoundSummary screen and next to every player name on the global and daily leaderboards.

**Architecture:** A pure `getRank(score)` utility in `lib/rank.ts` is the single source of truth. It's imported into `RoundSummary.tsx` (badge on result screen + daily leaderboard) and `StartScreen.tsx` (global + daily leaderboards). No API or data changes needed — rank is derived from score, and max possible is always 3000.

**Tech Stack:** Next.js App Router, TypeScript, inline `style` for dynamic rank colors (same pattern as existing `<mark>` highlights)

---

### Task 1: Create getRank utility

**Files:**
- Create: `lib/rank.ts`

**Step 1: Write the utility**

Create `lib/rank.ts` with this exact content:

```typescript
export interface Rank {
  label: string;
  color: string;
  glowClass: string;
}

const MAX_SCORE = 3000;

export function getRank(score: number): Rank {
  const efficiency = score / MAX_SCORE;
  if (efficiency >= 0.9) return { label: 'ELITE',      color: '#ffaa00', glowClass: 'glow-amber' };
  if (efficiency >= 0.75) return { label: 'SPECIALIST', color: '#ffaa00', glowClass: '' };
  if (efficiency >= 0.6)  return { label: 'ANALYST',    color: '#00ff41', glowClass: 'glow' };
  if (efficiency >= 0.4)  return { label: 'OPERATOR',   color: '#00ff41', glowClass: '' };
  return                         { label: 'NOVICE',     color: '#00aa28', glowClass: '' };
}
```

**Thresholds:**
- ELITE: ≥90% efficiency (score ≥ 2700)
- SPECIALIST: ≥75% (score ≥ 2250)
- ANALYST: ≥60% (score ≥ 1800)
- OPERATOR: ≥40% (score ≥ 1200)
- NOVICE: <40% (score < 1200)

**Step 2: Commit**
```bash
git add lib/rank.ts
git commit -m "feat: add getRank utility"
```

---

### Task 2: Add rank badge to RoundSummary score header

**Files:**
- Modify: `components/RoundSummary.tsx`

**Context:** `RoundSummary.tsx` already calculates `efficiency` at line 80. The score header renders a tier label (accuracy-based) and tier sub text. The rank badge (efficiency-based) goes immediately below the tier sub text, inside the same `px-3 py-5` div.

**Step 1: Import getRank**

Add to the import line at the top of `RoundSummary.tsx`:
```typescript
import { getRank } from '@/lib/rank';
```

**Step 2: Compute rank**

Add this line immediately after `const tier = getTier(score, total);` (line 28):
```typescript
const rank = getRank(totalScore);
```

**Step 3: Add rank badge below tier sub text**

Find this block in the score header:
```tsx
          <div className="text-xs font-mono text-[#00aa28]">{tier.sub}</div>
```

Replace with:
```tsx
          <div className="text-xs font-mono text-[#00aa28]">{tier.sub}</div>
          <div
            className={`text-xs font-mono font-bold tracking-widest mt-1 ${rank.glowClass}`}
            style={{ color: rank.color }}
          >
            [ {rank.label} ]
          </div>
```

**Step 4: Commit**
```bash
git add components/RoundSummary.tsx
git commit -m "feat: add rank badge to RoundSummary score header"
```

---

### Task 3: Add rank badge to RoundSummary daily leaderboard entries

**Files:**
- Modify: `components/RoundSummary.tsx`

**Context:** The daily leaderboard inside RoundSummary (lines 208–216) renders rows with position, name, and score. Add a rank badge between name and score.

**Step 1: Update each daily leaderboard row**

Find this block inside the `mode === 'daily'` leaderboard section:
```tsx
              <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                <span className={`text-[10px] font-mono w-4 shrink-0 ${i === 0 ? 'text-[#ffaa00]' : 'text-[#003a0e]'}`}>
                  {i + 1}
                </span>
                <span className="text-[#00aa28] text-xs font-mono flex-1 truncate">{entry.name}</span>
                <span className="text-[#00ff41] text-xs font-mono font-bold glow">{entry.score}</span>
              </div>
```

Replace with:
```tsx
              <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                <span className={`text-[10px] font-mono w-4 shrink-0 ${i === 0 ? 'text-[#ffaa00]' : 'text-[#003a0e]'}`}>
                  {i + 1}
                </span>
                <span className="text-[#00aa28] text-xs font-mono flex-1 truncate">{entry.name}</span>
                {(() => { const r = getRank(entry.score); return (
                  <span className={`text-[9px] font-mono shrink-0 ${r.glowClass}`} style={{ color: r.color }}>
                    {r.label}
                  </span>
                ); })()}
                <span className="text-[#00ff41] text-xs font-mono font-bold glow">{entry.score}</span>
              </div>
```

**Step 2: Commit**
```bash
git add components/RoundSummary.tsx
git commit -m "feat: add rank badges to RoundSummary daily leaderboard"
```

---

### Task 4: Add rank badge to StartScreen leaderboard entries

**Files:**
- Modify: `components/StartScreen.tsx`

**Context:** `StartScreen.tsx` has two leaderboard sections — `DAILY_TOP_ANALYSTS` (lines ~153–165) and `TOP_ANALYSTS` (lines ~190–202). Both render identical row structures. Add rank badge to both.

**Step 1: Import getRank**

Add to the import at top of `StartScreen.tsx`:
```typescript
import { getRank } from '@/lib/rank';
```

**Step 2: Update daily leaderboard rows**

Find the daily leaderboard entry row in `StartScreen.tsx`:
```tsx
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className={`text-[10px] font-mono w-4 shrink-0 ${i === 0 ? 'text-[#ffaa00]' : 'text-[#003a0e]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-[#00aa28] text-xs font-mono flex-1 truncate">
                      {entry.name}
                    </span>
                    <span className="text-[#00ff41] text-xs font-mono font-bold glow">
                      {entry.score}
                    </span>
                  </div>
```

Replace with:
```tsx
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className={`text-[10px] font-mono w-4 shrink-0 ${i === 0 ? 'text-[#ffaa00]' : 'text-[#003a0e]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-[#00aa28] text-xs font-mono flex-1 truncate">
                      {entry.name}
                    </span>
                    {(() => { const r = getRank(entry.score); return (
                      <span className={`text-[9px] font-mono shrink-0 ${r.glowClass}`} style={{ color: r.color }}>
                        {r.label}
                      </span>
                    ); })()}
                    <span className="text-[#00ff41] text-xs font-mono font-bold glow">
                      {entry.score}
                    </span>
                  </div>
```

**Step 3: Update global leaderboard rows**

Find the global leaderboard entry row in `StartScreen.tsx`:
```tsx
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className={`text-[10px] font-mono w-4 shrink-0 ${i === 0 ? 'text-[#ffaa00]' : 'text-[#003a0e]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-[#00aa28] text-xs font-mono flex-1 truncate">
                      {entry.name}
                    </span>
                    <span className="text-[#00ff41] text-xs font-mono font-bold glow">
                      {entry.score}
                    </span>
                  </div>
```

Replace with:
```tsx
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className={`text-[10px] font-mono w-4 shrink-0 ${i === 0 ? 'text-[#ffaa00]' : 'text-[#003a0e]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-[#00aa28] text-xs font-mono flex-1 truncate">
                      {entry.name}
                    </span>
                    {(() => { const r = getRank(entry.score); return (
                      <span className={`text-[9px] font-mono shrink-0 ${r.glowClass}`} style={{ color: r.color }}>
                        {r.label}
                      </span>
                    ); })()}
                    <span className="text-[#00ff41] text-xs font-mono font-bold glow">
                      {entry.score}
                    </span>
                  </div>
```

**Step 4: Run build to verify**
```bash
npm run build
```
Expected: Clean compile, no TypeScript errors.

**Step 5: Commit**
```bash
git add components/StartScreen.tsx
git commit -m "feat: add rank badges to StartScreen leaderboards"
```

---

### Task 5: Push to production

```bash
git push origin master
```

Vercel auto-deploys from master. Verify rank badges appear on:
- RoundSummary score header (below tier sub text)
- RoundSummary daily leaderboard (after daily game)
- StartScreen global leaderboard
- StartScreen daily leaderboard
