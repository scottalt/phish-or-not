import { type GimmickId, TIER1_GIMMICKS, TIER2_GIMMICKS } from './roguelike';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Assign gimmicks to each floor.
 * Floor 0 gets a random Tier 1 gimmick.
 * Floors 1+ each get a unique random Tier 2 gimmick (no repeats).
 * If there are more floors than Tier 2 gimmicks available, later floors may get null.
 */
export function assignGimmicks(floorCount: number): (GimmickId | null)[] {
  const result: (GimmickId | null)[] = [];

  // Floor 0: random Tier 1
  const tier1 = shuffle([...TIER1_GIMMICKS]);
  result.push(tier1[0] ?? null);

  // Floors 1+: unique Tier 2, no repeats
  const tier2Pool = shuffle([...TIER2_GIMMICKS]);
  for (let i = 1; i < floorCount; i++) {
    result.push(tier2Pool[i - 1] ?? null);
  }

  return result;
}

/**
 * Returns the timer duration in milliseconds for a gimmick on a given floor,
 * or null if the gimmick does not impose a timer.
 *
 * UNDER_PRESSURE: 15 000ms base, minus 2 000ms per floor, minimum 8 000ms.
 */
export function getTimerDuration(gimmick: GimmickId | null, floor: number): number | null {
  if (gimmick !== 'UNDER_PRESSURE') return null;
  const duration = 15000 - floor * 2000;
  return Math.max(8000, duration);
}
