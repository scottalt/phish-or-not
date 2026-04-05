import {
  type PerkId,
  type RoguelikeRunState,
  PERK_DEFS,
  ROGUELIKE_MAX_LIVES,
  SYNERGY_DEFS,
} from './roguelike';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Check whether the player currently owns a given perk.
 */
export function hasPerk(state: RoguelikeRunState, perkId: PerkId): boolean {
  return state.perks.includes(perkId);
}

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

/**
 * Perks gated behind permanent upgrades.
 * If the player doesn't own the required upgrade, the perk is excluded from the shop pool.
 */
const UPGRADE_GATED_PERKS: Partial<Record<PerkId, string>> = {
  SHIELD: 'SECOND_WIND', // Survival tier 3 — unlock SHIELD in shop
  // Phase 3: REVEAL_CLUE gated behind DEEP_NETWORK
};

/**
 * Return a random selection of available perks for the shop.
 *
 * Filters out:
 * - Non-stackable perks the player already owns
 * - EXTRA_LIFE when the player is already at max lives
 * - Perks gated behind permanent upgrades the player doesn't own
 *
 * @param state  - Current run state.
 * @param count  - How many offerings to return (may be fewer if pool is small).
 */
export function getShopOfferings(state: RoguelikeRunState, count: number): PerkId[] {
  const ownedCounts = new Map<PerkId, number>();
  for (const perk of state.perks) {
    ownedCounts.set(perk, (ownedCounts.get(perk) ?? 0) + 1);
  }

  const activeUpgrades = state.activeUpgrades ?? [];

  const available = PERK_DEFS.filter((def) => {
    // EXTRA_LIFE: cannot exceed max lives
    if (def.id === 'EXTRA_LIFE' && state.lives >= ROGUELIKE_MAX_LIVES) {
      return false;
    }

    // Upgrade-gated: exclude if the required upgrade is not owned
    const requiredUpgrade = UPGRADE_GATED_PERKS[def.id];
    if (requiredUpgrade && !activeUpgrades.includes(requiredUpgrade)) {
      return false;
    }

    // Non-stackable: exclude if already owned
    if (!def.stackable && hasPerk(state, def.id)) {
      return false;
    }

    // Stackable: exclude if at maxOwned
    const owned = ownedCounts.get(def.id) ?? 0;
    if (owned >= def.maxOwned) {
      return false;
    }

    return true;
  });

  const shuffled = shuffle(available);
  return shuffled.slice(0, count).map((d) => d.id);
}

/**
 * Apply a perk purchase to the run state.
 * Deducts Intel, records the perk, and applies immediate effects.
 *
 * Throws if the player cannot afford the perk.
 */
export function applyPerkPurchase(
  state: RoguelikeRunState,
  perkId: PerkId,
  priceOverride?: number,
): RoguelikeRunState {
  const def = PERK_DEFS.find((d) => d.id === perkId);
  if (!def) throw new Error(`Unknown perk: ${perkId}`);

  const effectiveCost = priceOverride ?? def.cost;
  if (state.intel < effectiveCost) throw new Error(`Insufficient Intel for perk: ${perkId}`);

  const next: RoguelikeRunState = {
    ...state,
    intel: state.intel - effectiveCost,
    perks: [...state.perks, perkId],
  };

  // Immediate effects
  if (perkId === 'EXTRA_LIFE') {
    next.lives = Math.min(next.lives + 1, ROGUELIKE_MAX_LIVES);
  }
  if (perkId === 'INTEL_CACHE') {
    // COMPOUND_INTEREST synergy: 25 instead of 20 if player also owns DOUBLE_INTEL
    const hasCompound = state.perks.includes('DOUBLE_INTEL');
    next.intel += hasCompound ? 25 : 20;
  }

  return next;
}
