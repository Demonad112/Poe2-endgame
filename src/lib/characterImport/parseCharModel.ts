import type {
  DefensiveStats,
  GearItem,
  ImportedCharacter,
  ImportProvenance,
  SkillSetup,
} from "./types";
import { estimateEhp } from "./ehpEstimate";

// PoE2 ascendancy -> base class. poe.ninja's charModel `class` field carries
// the ASCENDANCY name ("Deadeye") once a character has ascended, not the
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

// poe.ninja's numeric equipment-slot enum (observed from live charModels).
// Best-effort — unknown ids fall back to no label rather than a wrong one.
const SLOT_LABELS: Record<number, string> = {
  1: "Helmet",
  2: "Gloves",
  3: "Body Armour",
  4: "Amulet",
  5: "Boots",
  6: "Off Hand",
  7: "Main Hand",
  8: "Ring",
  9: "Ring",
  11: "Belt",
  15: "Main Hand (Swap)",
  16: "Off Hand (Swap)",
};

// PoE frameType -> rarity name.
const FRAME_TYPE_RARITY: Record<number, string> = {
  0: "Normal",
  1: "Magic",
  2: "Rare",
  3: "Unique",
  4: "Gem",
  5: "Currency",
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

// poe.ninja skills carry gems under `allGems` (each with an
// `itemData.support` flag marking the active skill vs its supports). Older /
// simplified shapes use a flat `gems` array where the first entry is the
// active skill. Handle both.
function normalizeSkills(raw: unknown): SkillSetup[] {
  if (!Array.isArray(raw)) return [];
  const out: SkillSetup[] = [];
  for (const setup of raw) {
    const rec = asRecord(setup);
    const gems = Array.isArray(rec.allGems)
      ? rec.allGems
      : Array.isArray(rec.gems)
        ? rec.gems
        : [];
    if (gems.length === 0) continue;

    const isSupport = (g: unknown) =>
      asRecord(asRecord(g).itemData).support === true;
    const activeIdx = gems.findIndex(
      (g) => asRecord(asRecord(g).itemData).support === false
    );
    const mainGem = asRecord(gems[activeIdx >= 0 ? activeIdx : 0]);
    const mainName = str(mainGem, "name");
    if (!mainName) continue;

    const supports = gems
      .filter((g, i) => (activeIdx >= 0 ? isSupport(g) : i > 0))
      .map((g) => str(asRecord(g), "name") ?? "?");

    out.push({
      main: mainName,
      level: num(mainGem, "level"),
      quality: num(mainGem, "quality"),
      supports,
    });
  }
  return out;
}

function modsFrom(itemData: Record<string, unknown>): string[] {
  const collect = (key: string): string[] => {
    const v = itemData[key];
    return Array.isArray(v) ? v.filter((m): m is string => typeof m === "string") : [];
  };
  return [...collect("implicitMods"), ...collect("explicitMods")];
}

// poe.ninja items are `{ itemData, itemSlot }` (itemSlot a numeric enum);
// simplified shapes are a flat object with a string `slot`. Handle both.
function normalizeGear(raw: unknown): GearItem[] {
  const items = Array.isArray(raw) ? raw : [];
  const out: GearItem[] = [];
  for (const entry of items) {
    const wrapper = asRecord(entry);
    const isWrapped = "itemData" in wrapper;
    const data = isWrapped ? asRecord(wrapper.itemData) : wrapper;

    let slot: string;
    if (isWrapped) {
      const slotId = wrapper.itemSlot;
      slot = typeof slotId === "number" ? (SLOT_LABELS[slotId] ?? "") : "";
    } else {
      slot = str(data, "slot") ?? "";
    }

    const rarity = isWrapped
      ? FRAME_TYPE_RARITY[num(data, "frameType")] ?? "Normal"
      : str(data, "rarity") ?? "Normal";

    out.push({
      slot,
      name: str(data, "name") || "Unknown",
      base: str(data, "typeLine") ?? str(data, "baseType") ?? str(data, "type_line") ?? str(data, "base_type") ?? "",
      itemLevel: num(data, "ilvl") || num(data, "item_level"),
      rarity,
      mods: isWrapped
        ? modsFrom(data)
        : Array.isArray(data.mods)
          ? data.mods.filter((m): m is string => typeof m === "string")
          : [],
    });
  }
  return out;
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
// much larger parser that isn't ported yet.
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

  // Prefer poe.ninja's own effectiveHealthPool; fall back to the rough stub.
  const ehpIsEstimate = stats.effectiveHealthPool <= 0;
  const ehp = ehpIsEstimate ? estimateEhp(stats) : stats.effectiveHealthPool;

  return {
    name: model.name ?? fallbackCharacter ?? "Unknown",
    account: model.account ?? fallbackAccount ?? "Unknown",
    level: model.level ?? 0,
    characterClass,
    ascendancy,
    league: model.league ?? "Unknown",
    stats,
    ehp,
    ehpIsEstimate,
    skills: normalizeSkills(model.skills),
    gear: normalizeGear(model.items ?? model.equipment),
    passivePointsAllocated: countPassivePoints(model.passiveSelection),
    provenance,
  };
}
