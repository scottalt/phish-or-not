// SIGINT dialogue system — imports personality from sigint-personality.ts
// This file handles the display/tracking logic. Edit personality in sigint-personality.ts.

export type { SigintDialogue as HandlerDialogue } from './sigint-personality';
import { ALL_DIALOGUES } from './sigint-personality';
import { playerGet, playerSet } from './player-storage';

export const HANDLER_DIALOGUES = ALL_DIALOGUES;

/** Check if a handler moment has been seen (player-scoped localStorage cache for fast sync checks) */
export function hasSeenMoment(momentId: string): boolean {
  try {
    const seen = JSON.parse(playerGet('handler_moments_seen') ?? '[]');
    return seen.includes(momentId);
  } catch { return false; }
}

/** Mark a handler moment as seen — writes to player-scoped localStorage cache AND persists to DB */
export function markMomentSeen(momentId: string): void {
  // Local cache (sync, immediate, player-scoped)
  try {
    const seen = JSON.parse(playerGet('handler_moments_seen') ?? '[]');
    if (!seen.includes(momentId)) {
      seen.push(momentId);
      playerSet('handler_moments_seen', JSON.stringify(seen));
    }
  } catch { /* ignore */ }

  // DB persist (async, fire and forget)
  fetch('/api/player/moments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ momentId }),
  }).catch(() => {});
}

/** Check if a moment has been seen using profile data (DB-backed, cross-device) */
export function hasSeenMomentFromProfile(seenMoments: string[] | undefined, momentId: string): boolean {
  return (seenMoments ?? []).includes(momentId);
}
