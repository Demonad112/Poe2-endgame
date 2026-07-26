export type ImportMethod = "live-fetch" | "pasted-json";

// Provenance for a live, user-specific import — distinct from SourceRef
// (src/lib/types.ts), which tracks whether a *static game-knowledge claim*
// is verified. There's no "unverified" state for "this is what poe.ninja
// returned for this character right now" — it's a timestamped snapshot,
// not a claim to fact-check.
export interface ImportProvenance {
  fetchedAt: string;
  sourceUrl?: string;
  importMethod: ImportMethod;
}

export interface DefensiveStats {
  life: number;
  energyShield: number;
  ward: number;
  armour: number;
  evasionRating: number;
  evadeChance: number;
  blockChance: number;
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  chaosResistance: number;
  effectiveHealthPool: number;
}

export interface SkillSetup {
  main: string;
  level: number;
  quality: number;
  supports: string[];
}

export type ModCategory =
  | "implicit"
  | "explicit"
  | "crafted"
  | "desecrated"
  | "rune"
  | "enchant";

/** A single resistance granted by one modifier on an item. */
export interface ResistanceGrant {
  type: "fire" | "cold" | "lightning" | "chaos";
  value: number;
  /** Tier parsed from the mod id (e.g. FireResist7 -> 7), when derivable. */
  tier: number | null;
  modId: string;
  category: ModCategory;
}

/** A modifier with its game id and stat values, as poe.ninja supplies it. */
export interface StructuredMod {
  id: string;
  category: ModCategory;
  stats: Record<string, number>;
}

export interface GearItem {
  slot: string;
  name: string;
  base: string;
  itemLevel: number;
  rarity: string;
  /** Human-readable modifier lines, grouped by where they came from. */
  mods: { category: ModCategory; text: string }[];
  /** Structured resistance contributions, used by the advice engine. */
  resistances: ResistanceGrant[];
  /** Every structured modifier, used by the gear audit. */
  structuredMods: StructuredMod[];
}

export interface DamageTypeBreakdown {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

// Stats computed by Path of Building itself, decoded from the
// `pathOfBuildingExport` blob poe.ninja embeds in the character model.
// These are PoB's numbers, not ours — notably real DPS, which we have no
// calculator for.
export interface PobStats {
  mainSkill?: string;
  combinedDps: number;
  totalDps: number;
  dotDps: number;
  averageDamage: number;
  /** Attacks/casts per second. */
  speed: number;
  critChance: number;
  critMultiplier: number;
  hitChance: number;
  accuracy: number;
  totalEhp: number;
  /** Largest single hit survivable, per damage type — exposes one-shot risk. */
  maxHitTaken: DamageTypeBreakdown;
  resistOverCap: Omit<DamageTypeBreakdown, "physical">;
  physicalDamageReduction: number;
  spellSuppression: number;
  blockChance: number;
}

/**
 * Bumped whenever ImportedCharacter's shape changes in a way older stored
 * data can't satisfy. A pinned character whose version doesn't match is
 * discarded on load rather than rendered — an out-of-date snapshot is one
 * re-import away, whereas feeding it to code expecting new fields crashed
 * the whole page.
 */
export const CHARACTER_SCHEMA_VERSION = 3;

export interface ImportedCharacter {
  schemaVersion: number;
  name: string;
  account: string;
  level: number;
  characterClass: string;
  ascendancy?: string;
  league: string;
  stats: DefensiveStats;
  ehp: number;
  // poe.ninja ships its own effectiveHealthPool; when present we show that
  // real number, otherwise we fall back to the rough estimateEhp() stub.
  ehpIsEstimate: boolean;
  skills: SkillSetup[];
  gear: GearItem[];
  passivePointsAllocated: number;
  /** Present when the character had a decodable Path of Building export. */
  pob?: PobStats;
  provenance: ImportProvenance;
}
