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

export interface ImportedCharacter {
  name: string;
  account: string;
  level: number;
  characterClass: string;
  ascendancy?: string;
  league: string;
  stats: DefensiveStats;
  ehpEstimate: number;
  skills: SkillSetup[];
  gear: GearItem[];
  passivePointsAllocated: number;
  provenance: ImportProvenance;
}
