export type ResistanceType = "fire" | "cold" | "lightning" | "chaos";

export interface ResistTier {
  tier: number;
  /** Minimum item level required for this tier to roll. */
  ilvl: number;
  min: number;
  max: number;
}

// Resistance suffix tiers, extracted from the game's own mod table via the
// poe2-mcp project (data/poe2_mods_corrected.json, sourced from mods.datc64)
// and then validated row-for-row against RePoE's PoE2 dump
// (repoe-fork.github.io/poe2/mods.json) — all 30 rows matched on both value
// range and required level, with no higher tiers missing.
// If a patch shifts these, this table is the single place to update.
export const RESIST_TIERS: Record<string, ResistTier[]> = {
  FireResist: [
    { tier: 1, ilvl: 1, min: 6, max: 10 },
    { tier: 2, ilvl: 12, min: 11, max: 15 },
    { tier: 3, ilvl: 24, min: 16, max: 20 },
    { tier: 4, ilvl: 36, min: 21, max: 25 },
    { tier: 5, ilvl: 48, min: 26, max: 30 },
    { tier: 6, ilvl: 60, min: 31, max: 35 },
    { tier: 7, ilvl: 71, min: 36, max: 40 },
    { tier: 8, ilvl: 82, min: 41, max: 45 },
  ],
  ColdResist: [
    { tier: 1, ilvl: 1, min: 6, max: 10 },
    { tier: 2, ilvl: 14, min: 11, max: 15 },
    { tier: 3, ilvl: 26, min: 16, max: 20 },
    { tier: 4, ilvl: 38, min: 21, max: 25 },
    { tier: 5, ilvl: 50, min: 26, max: 30 },
    { tier: 6, ilvl: 60, min: 31, max: 35 },
    { tier: 7, ilvl: 71, min: 36, max: 40 },
    { tier: 8, ilvl: 82, min: 41, max: 45 },
  ],
  LightningResist: [
    { tier: 1, ilvl: 1, min: 6, max: 10 },
    { tier: 2, ilvl: 13, min: 11, max: 15 },
    { tier: 3, ilvl: 25, min: 16, max: 20 },
    { tier: 4, ilvl: 37, min: 21, max: 25 },
    { tier: 5, ilvl: 49, min: 26, max: 30 },
    { tier: 6, ilvl: 60, min: 31, max: 35 },
    { tier: 7, ilvl: 71, min: 36, max: 40 },
    { tier: 8, ilvl: 82, min: 41, max: 45 },
  ],
  ChaosResist: [
    { tier: 1, ilvl: 16, min: 4, max: 7 },
    { tier: 2, ilvl: 30, min: 8, max: 11 },
    { tier: 3, ilvl: 44, min: 12, max: 15 },
    { tier: 4, ilvl: 56, min: 16, max: 19 },
    { tier: 5, ilvl: 68, min: 20, max: 23 },
    { tier: 6, ilvl: 81, min: 24, max: 27 },
  ],
};

export const RESIST_FAMILY: Record<ResistanceType, string> = {
  fire: "FireResist",
  cold: "ColdResist",
  lightning: "LightningResist",
  chaos: "ChaosResist",
};

export const RESIST_STAT_ID: Record<string, ResistanceType> = {
  "base_fire_damage_resistance_%": "fire",
  "base_cold_damage_resistance_%": "cold",
  "base_lightning_damage_resistance_%": "lightning",
  "base_chaos_damage_resistance_%": "chaos",
};

export const RESIST_LABEL: Record<ResistanceType, string> = {
  fire: "Fire",
  cold: "Cold",
  lightning: "Lightning",
  chaos: "Chaos",
};

/** In-game suffix name for each resistance family (per RePoE). */
export const RESIST_SUFFIX_NAME: Record<ResistanceType, string> = {
  fire: "of Magma",
  cold: "of the Ice",
  lightning: "of the Lightning",
  chaos: "of Bameth",
};

// RePoE's spawn weights for these suffixes are armour / ring / amulet / belt,
// with everything else at weight 0 — so resistance cannot roll on weapons or
// quivers. Suggesting a resistance craft on a bow would be wrong, hence this
// gate on which of our slot labels can actually host one.
const RESIST_ELIGIBLE_SLOTS = new Set([
  "Helmet",
  "Gloves",
  "Body Armour",
  "Boots",
  "Ring",
  "Amulet",
  "Belt",
]);

export function slotCanRollResistance(slot: string, base: string): boolean {
  if (RESIST_ELIGIBLE_SLOTS.has(slot)) return true;
  // Off-hand is a quiver for bow builds (ineligible) but a shield counts as
  // armour, so fall back to the base type for that slot.
  return /shield|buckler/i.test(base);
}

/** Tier number encoded in a mod id, e.g. "FireResist7" -> 7. */
export function tierFromModId(modId: string): number | null {
  const m = /^([A-Za-z]+?)(\d+)$/.exec(modId);
  return m ? Number(m[2]) : null;
}

/** The best tier of a resistance that an item of this level could roll. */
export function bestTierForIlvl(
  type: ResistanceType,
  ilvl: number
): ResistTier | null {
  const tiers = RESIST_TIERS[RESIST_FAMILY[type]];
  if (!tiers) return null;
  const eligible = tiers.filter((t) => ilvl >= t.ilvl);
  return eligible.length > 0 ? eligible[eligible.length - 1] : null;
}

export function tierByNumber(
  type: ResistanceType,
  tier: number
): ResistTier | null {
  return RESIST_TIERS[RESIST_FAMILY[type]]?.find((t) => t.tier === tier) ?? null;
}
