/**
 * Player-scoped localStorage/sessionStorage wrapper.
 *
 * Every key is prefixed with the player's ID so that switching accounts
 * on the same device never leaks state between players.
 */

let _playerId: string | null = null;

export function setStoragePlayerId(id: string | null) {
  _playerId = id;
}

function scopedKey(key: string): string | null {
  if (!_playerId) return null;
  return `p:${_playerId}:${key}`;
}

// ── localStorage ──

export function playerGet(key: string): string | null {
  const k = scopedKey(key);
  if (!k) return null;
  try { return localStorage.getItem(k); } catch { return null; }
}

export function playerSet(key: string, value: string): void {
  const k = scopedKey(key);
  if (!k) return;
  try { localStorage.setItem(k, value); } catch {}
}

export function playerRemove(key: string): void {
  const k = scopedKey(key);
  if (!k) return;
  try { localStorage.removeItem(k); } catch {}
}

// ── sessionStorage ──

export function sessionGet(key: string): string | null {
  const k = scopedKey(key);
  if (!k) return null;
  try { return sessionStorage.getItem(k); } catch { return null; }
}

export function sessionSet(key: string, value: string): void {
  const k = scopedKey(key);
  if (!k) return;
  try { sessionStorage.setItem(k, value); } catch {}
}

export function sessionRemove(key: string): void {
  const k = scopedKey(key);
  if (!k) return;
  try { sessionStorage.removeItem(k); } catch {}
}

/**
 * Clear ALL player-scoped keys from both storages.
 * Called on sign-out to ensure clean slate.
 */
export function clearAllPlayerStorage(): void {
  try {
    const prefix = _playerId ? `p:${_playerId}:` : 'p:';
    // Clear scoped keys for current player
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(prefix)) sessionStorage.removeItem(k);
    }
    // Also clean up legacy unscoped keys from before this change
    const legacyKeys = [
      'xp_cooldown', 'handler_moments_seen', 'terminal_theme',
      'sigint_greeting_bag', 'weakness_history', 'lastSeenVersion',
    ];
    for (const k of legacyKeys) localStorage.removeItem(k);
    const legacySessionKeys = ['sigint_spoke', 'sigint_greeted', 'bootSeen'];
    for (const k of legacySessionKeys) sessionStorage.removeItem(k);
    // Clean legacy daily_* keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('daily_')) localStorage.removeItem(k);
    }
  } catch {}
}
