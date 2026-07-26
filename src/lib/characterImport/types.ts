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
  /** Corrupted items cannot be modified, so no affix advice applies. */
  corrupted: boolean;
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

/**
 * The Path of Building configuration the export was saved with — the
 * assumptions baked into every DPS figure we display. Read from the <Input>
 * elements under <Calcs>; see pobConfig.ts for why this matters.
 */
export interface PobConfig {
  /** How many config inputs were set. 0 means PoB defaults were used. */
  inputCount: number;
  /** Whether the numbers were calculated against a boss. */
  versusBoss: boolean;
  /** PoB's buff mode, when set. "effective" assumes all buffs/charges up. */
  buffMode: "unbuffed" | "combat" | "effective" | null;
  /** Human-readable damage-relevant conditions assumed true. */
  conditionals: string[];
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
  /** Allocated passive node ids from PoB's own <Spec>, when present. */
  allocatedNodes: number[];
  /** The assumptions the figures above were calculated under. */
  config: PobConfig;
}

/**
 * Bumped whenever ImportedCharacter's shape changes in a way older stored
 * data can't satisfy. A pinned character whose version doesn't match is
 * discarded on load rather than rendered — an out-of-date snapshot is one
 * re-import away, whereas feeding it to code expecting new fields crashed
 * the whole page.
 *
 * 4: PobStats gained `config` and `allocatedNodes`. A v3 character has a
 *    `pob` without them, and the config drives text the UI now always
 *    renders alongside DPS, so a stale one must not be revived.
 * 5: GearItem gained `corrupted`. Absent, it reads as undefined and a
 *    corrupted item would be offered craft advice it cannot accept.
 */
export const CHARACTER_SCHEMA_VERSION = 5;

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
