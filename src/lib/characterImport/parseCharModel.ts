import type {
  DefensiveStats,
  GearItem,
  ImportedCharacter,
  ImportProvenance,
  SkillSetup,
} from "./types";
import { estimateEhp } from "./ehpEstimate";

// PoE2 ascendancy -> base class. poe.ninja's charModel `class` field carries
// the ASCENDANCY name ("Infernalist") once a character has ascended, not the
// base class — ported from poe2-mcp's ASCENDANCY_TO_BASE_CLASS
// (src/api/poe_ninja_api.py) so class/ascendancy display split correctly.
const ASCENDANCY_TO_BASE_CLASS: Record<string, string> = {
  Titan: "Warrior",
  Warbringer: "Warrior",
  "Smith of Kitava": "Warrior",
  Deadeye: "Ranger",
  Pathfinder: "Ranger",
  Amazon: "Huntress",
  Ritualist: "Huntress",
  Infernalist: "Witch",
  "Blood Mage": "Witch",
  Bloodmage: "Witch",
  Lich: "Witch",
  "Abyssal Lich": "Witch",
  Stormweaver: "Sorceress",
  Chronomancer: "Sorceress",
  "Disciple of Varashta": "Sorceress",
  Tactician: "Mercenary",
  Witchhunter: "Mercenary",
  "Gemling Legionnaire": "Mercenary",
  Invoker: "Monk",
  "Acolyte of Chayula": "Monk",
  Oracle: "Druid",
  Shaman: "Druid",
};

export class CharModelParseError extends Error {}

interface RawCharModel {
  name?: string;
  account?: string;
  level?: number;
  class?: string;
  league?: string;
  items?: unknown[];
  equipment?: unknown[];
  skills?: unknown[];
  passiveSelection?: unknown;
  defensiveStats?: Record<string, number>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function num(rec: Record<string, unknown>, key: string): number {
  const v = rec[key];
  return typeof v === "number" ? v : 0;
}

function str(rec: Record<string, unknown>, key: string): string | undefined {
  const v = rec[key];
  return typeof v === "string" ? v : undefined;
}

/**
 * Accepts either the full `{type, charModel}` envelope returned by
 * poe.ninja's model endpoint, or a bare charModel object (e.g. a user
 * pastes just the inner object).
 */
export function extractCharModel(raw: unknown): RawCharModel {
  const outer = asRecord(raw);
  const candidate = "charModel" in outer ? asRecord(outer.charModel) : outer;
  if (!candidate || Object.keys(candidate).length === 0) {
    throw new CharModelParseError(
      "That doesn't look like character data — expected an object with fields like name/level/class (a charModel, or the full {type, charModel} response)."
    );
  }
  return candidate as RawCharModel;
}

function normalizeSkills(raw: unknown): SkillSetup[] {
  if (!Array.isArray(raw)) return [];
  const out: SkillSetup[] = [];
  for (const setup of raw) {
    const rec = asRecord(setup);
    const gems = Array.isArray(rec.gems) ? rec.gems : [];
    if (gems.length === 0) continue;
    const main = asRecord(gems[0]);
    out.push({
      main: str(main, "name") ?? "?",
      level: num(main, "level"),
      quality: num(main, "quality"),
      supports: gems.slice(1).map((g) => str(asRecord(g), "name") ?? "?"),
    });
  }
  return out;
}

function normalizeGear(raw: unknown): GearItem[] {
  const items = Array.isArray(raw) ? raw : [];
  return items.map((it) => {
    const rec = asRecord(it);
    const modsRaw = rec.mods;
    return {
      slot: str(rec, "slot") ?? "Jewel",
      name: str(rec, "name") ?? "Unknown",
      base: str(rec, "type_line") ?? str(rec, "base_type") ?? "",
      itemLevel: num(rec, "item_level"),
      rarity: str(rec, "rarity") ?? "Normal",
      mods: Array.isArray(modsRaw)
        ? modsRaw.filter((m): m is string => typeof m === "string")
        : [],
    };
  });
}

function countPassivePoints(raw: unknown): number {
  if (Array.isArray(raw)) return raw.length;
  const rec = asRecord(raw);
  if (Array.isArray(rec.allocated_nodes)) return rec.allocated_nodes.length;
  return 0;
}

function normalizeStats(raw: Record<string, number> | undefined): DefensiveStats {
  const rec = raw ?? {};
  return {
    life: rec.life ?? 0,
    energyShield: rec.energyShield ?? 0,
    ward: rec.ward ?? 0,
    armour: rec.armour ?? 0,
    evasionRating: rec.evasionRating ?? 0,
    evadeChance: rec.evadeChance ?? 0,
    blockChance: rec.blockChance ?? 0,
    fireResistance: rec.fireResistance ?? 0,
    coldResistance: rec.coldResistance ?? 0,
    lightningResistance: rec.lightningResistance ?? 0,
    chaosResistance: rec.chaosResistance ?? 0,
    effectiveHealthPool: rec.effectiveHealthPool ?? 0,
  };
}

// Port of poe2-mcp's _normalize_character_data (character_fetcher.py),
// scoped to the fields available directly on charModel — the
// pathOfBuildingExport decode path (base64+zlib PoB2 XML) is a separate,
// much larger parser that isn't ported yet, so characters without rich
// charModel.defensiveStats/skills/items will show sparser data here.
export function normalizeCharacter(
  raw: unknown,
  provenance: ImportProvenance,
  fallbackAccount?: string,
  fallbackCharacter?: string
): ImportedCharacter {
  const model = extractCharModel(raw);
  const stats = normalizeStats(model.defensiveStats);

  let characterClass = model.class ?? "Unknown";
  let ascendancy: string | undefined;
  if (characterClass in ASCENDANCY_TO_BASE_CLASS) {
    ascendancy = characterClass;
    characterClass = ASCENDANCY_TO_BASE_CLASS[characterClass];
  }

  return {
    name: model.name ?? fallbackCharacter ?? "Unknown",
    account: model.account ?? fallbackAccount ?? "Unknown",
    level: model.level ?? 0,
    characterClass,
    ascendancy,
    league: model.league ?? "Unknown",
    stats,
    ehpEstimate: estimateEhp(stats),
    skills: normalizeSkills(model.skills),
    gear: normalizeGear(model.items ?? model.equipment),
    passivePointsAllocated: countPassivePoints(model.passiveSelection),
    provenance,
  };
}
