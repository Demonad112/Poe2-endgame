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

export interface GearItem {
  slot: string;
  name: string;
  base: string;
  itemLevel: number;
  rarity: string;
  mods: string[];
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

export interface ImportedCharacter {
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
