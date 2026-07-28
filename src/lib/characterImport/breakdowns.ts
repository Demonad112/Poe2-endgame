// Stat attribution — where each defensive number actually comes from.
//
// Every charModel poe.ninja returns carries a `breakdowns` object that the app
// ignored entirely until now. It is a complete attribution model: for each
// stat, the flat and increased modifiers that produce it, each pointing at the
// item, passive, quest or attribute responsible.
//
//   stats[0]  = {base: 2874, inc: 5, more: 1, total: 3018,
//                mods: [[0, 150, 82], [0, 184, 82], ..., [1, 5, 88]]}
//   sources[82] = [2, "Soul Glance, Deerstalker Hood"]
//
// Why this matters: the gear audit used to recommend upgrades blind to what an
// item was holding up. It would happily suggest re-rolling a ring that was
// carrying 26% of a capped fire resistance, while the resistance panel — which
// had no idea the two were connected — reported that resistance as fine. This
// is the data that lets one side know about the other.
//
// SHAPE VERIFIED against 44 live level-100 characters spanning 12 ascendancies
// (see scripts/verify-breakdowns.mjs, which re-runs the check). Two invariants
// held on every single one, and they are the ones attribution depends on:
//
//   sum of flat mods    === base   44/44 for every stat
//   sum of increased    === inc    44/44 for every stat
//
// Deliberately NOT relied upon: base * (1 + inc/100) * more === total. That
// holds for most stats but fails for resistances (clamped to max: base 92
// renders as total 75) and for the handful of stats carrying rarer `more`
// multipliers the array does not expose. The reported `total` is used as-is
// and cross-checked against the character sheet instead.

import type { DefensiveStats, GearItem } from "./types";

/**
 * The defensive stats we attribute. Restricted to fields DefensiveStats also
 * carries, so every parsed entry can be cross-checked against the character
 * sheet — an attribution that disagrees with the number on screen is worse
 * than no attribution at all.
 *
 * The breakdown array holds 35 entries; the rest are mana, spirit, the three
 * attributes, movement speed, item rarity, charges, deflection and several
 * indices that were zero on all 44 sampled characters and could not be
 * identified. Those are skipped rather than guessed at.
 */
export type AttributableStat =
  | "life"
  | "energyShield"
  | "ward"
  | "armour"
  | "evasionRating"
  | "fireResistance"
  | "coldResistance"
  | "lightningResistance"
  | "chaosResistance";

/**
 * Index into poe.ninja's breakdown array -> stat name.
 *
 * Resolved empirically: for each index, the set of DefensiveStats keys whose
 * value equalled that entry's total, intersected across the whole 44-character
 * corpus. Every mapping below matched 44/44 except chaosResistance, whose 8
 * misses were all Chaos Inoculation characters (see `matchesSheet`).
 */
const STAT_BY_INDEX: Record<number, AttributableStat> = {
  0: "life",
  2: "energyShield",
  4: "armour",
  5: "evasionRating",
  14: "fireResistance",
  15: "coldResistance",
  16: "lightningResistance",
  17: "chaosResistance",
  26: "ward",
};

/** Resistances are clamped to a maximum; other stats are not. */
const IS_RESISTANCE: Record<AttributableStat, boolean> = {
  life: false,
  energyShield: false,
  ward: false,
  armour: false,
  evasionRating: false,
  fireResistance: true,
  coldResistance: true,
  lightningResistance: true,
  chaosResistance: true,
};

export type SourceKind =
  | "character"
  | "passive"
  | "item"
  | "skill"
  | "attribute"
  | "quest"
  | "conversion"
  | "unknown";

/**
 * Source kind tags, observed across the corpus. Kind 0 carries no name and is
 * the character's own base value (level-granted life, the game's -60% starting
 * elemental resistance); 4 and 6 were never seen.
 */
const SOURCE_KIND: Record<number, SourceKind> = {
  0: "character",
  1: "passive",
  2: "item",
  3: "skill",
  5: "attribute",
  7: "quest",
  8: "conversion",
};

export interface Contribution {
  /** "flat" adds to the base value; "increased" adds to the % increase. */
  kind: "flat" | "increased";
  value: number;
  /** Display label. Passive sources carry a node id rather than a name. */
  source: string;
  sourceKind: SourceKind;
  /** Item name, when the source is an equipped item or jewel. */
  itemName?: string;
  /** Item base type, e.g. "Ruby Ring". */
  itemBase?: string;
}

export interface StatAttribution {
  stat: AttributableStat;
  /** Sum of flat contributions. */
  base: number;
  /** Sum of increased contributions, as a percentage. */
  increasedPercent: number;
  /** The value poe.ninja reports, after any cap. */
  total: number;
  /**
   * How far the uncapped value exceeds the displayed one. Non-zero only for
   * resistances, where it is the overcap a player is carrying as map-mod
   * insurance — and which they could trade away for something else.
   */
  overcap: number;
  /**
   * Whether `total` agrees with the character sheet. False means something
   * downstream overrides the sum — Chaos Inoculation reporting 100% chaos
   * resistance over a breakdown that sums to 0 is the case seen in practice.
   * Callers must not present attribution for a stat where this is false.
   */
  matchesSheet: boolean;
  contributions: Contribution[];
}

interface RawStat {
  base: number;
  inc: number;
  more: number;
  total: number;
  mods: [number, number, number][];
}

function isRawStat(v: unknown): v is RawStat {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.base === "number" &&
    typeof r.inc === "number" &&
    typeof r.total === "number" &&
    Array.isArray(r.mods)
  );
}

/** Split "Soul Glance, Deerstalker Hood" into its name and base type. */
function splitItemSource(label: string): { name: string; base: string } {
  const comma = label.lastIndexOf(", ");
  if (comma === -1) return { name: label, base: "" };
  return { name: label.slice(0, comma), base: label.slice(comma + 2) };
}

/**
 * Decode the attribution for every stat we can validate.
 *
 * An entry is dropped rather than returned when its modifiers don't reproduce
 * the base and increase it claims — a breakdown that doesn't add up cannot be
 * shown to a player as an explanation of anything.
 */
export function parseBreakdowns(
  raw: unknown,
  sheet: DefensiveStats
): StatAttribution[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as { stats?: unknown; sources?: unknown };
  if (!obj.stats || typeof obj.stats !== "object") return [];
  const sources = Array.isArray(obj.sources) ? obj.sources : [];
  const stats = obj.stats as Record<string, unknown>;

  const out: StatAttribution[] = [];

  for (const [indexKey, stat] of Object.entries(STAT_BY_INDEX)) {
    const entry = stats[indexKey];
    if (!isRawStat(entry)) continue;

    const contributions: Contribution[] = [];
    let flatSum = 0;
    let incSum = 0;

    for (const mod of entry.mods) {
      if (!Array.isArray(mod) || mod.length < 3) continue;
      const [modKind, value, sourceIndex] = mod;
      // Kinds beyond flat/increased exist but are rare and their semantics
      // aren't established, so they're excluded from the sums below — which
      // is why the invariant check that follows will drop the stat if any
      // were load-bearing.
      if (modKind !== 0 && modKind !== 1) continue;
      if (typeof value !== "number") continue;

      const rawSource = sources[sourceIndex];
      const kindId = Array.isArray(rawSource) ? rawSource[0] : -1;
      const label = Array.isArray(rawSource) ? rawSource[1] : undefined;
      const sourceKind = SOURCE_KIND[kindId] ?? "unknown";

      const contribution: Contribution = {
        kind: modKind === 0 ? "flat" : "increased",
        value,
        source:
          typeof label === "string" && label.length > 0
            ? label
            : sourceKind === "character"
              ? "Character base"
              : "Unknown",
        sourceKind,
      };

      if (sourceKind === "item" && typeof label === "string") {
        const { name, base } = splitItemSource(label);
        contribution.itemName = name;
        contribution.itemBase = base;
      }

      if (modKind === 0) flatSum += value;
      else incSum += value;
      contributions.push(contribution);
    }

    // The invariant the whole feature rests on. Held 44/44 across the corpus;
    // if it ever stops holding, the honest response is to show nothing.
    if (Math.abs(flatSum - entry.base) > 1) continue;
    if (Math.abs(incSum - entry.inc) > 1) continue;

    const uncapped = IS_RESISTANCE[stat]
      ? Math.round(entry.base * (1 + entry.inc / 100))
      : entry.total;

    out.push({
      stat,
      base: entry.base,
      increasedPercent: entry.inc,
      total: entry.total,
      overcap: IS_RESISTANCE[stat] ? Math.max(0, uncapped - entry.total) : 0,
      matchesSheet: entry.total === sheet[stat],
      contributions,
    });
  }

  return out;
}

/** Human label for a stat, for use in sentences. */
export const STAT_LABEL: Record<AttributableStat, string> = {
  life: "Life",
  energyShield: "Energy Shield",
  ward: "Ward",
  armour: "Armour",
  evasionRating: "Evasion Rating",
  fireResistance: "Fire Resistance",
  coldResistance: "Cold Resistance",
  lightningResistance: "Lightning Resistance",
  chaosResistance: "Chaos Resistance",
};

export interface ItemStatContribution {
  stat: AttributableStat;
  /** Flat amount this item grants. */
  flat: number;
  /** Percentage increase this item grants. */
  increased: number;
  /**
   * What the stat would fall to without this item, ignoring any cap. For a
   * capped resistance this is the honest number to warn on: a resistance
   * sitting at 75 with 17 overcap only drops below cap if the item is worth
   * more than the overcap.
   */
  without: number;
}

export interface ItemAttribution {
  itemName: string;
  slot: string;
  contributions: ItemStatContribution[];
}

/**
 * What each equipped item contributes, keyed by the item's slot.
 *
 * Only stats whose attribution agrees with the character sheet are included,
 * so a Chaos Inoculation character gets no chaos entries rather than a
 * confidently wrong one.
 */
export function attributionByItem(
  attributions: StatAttribution[],
  gear: GearItem[]
): ItemAttribution[] {
  const byName = new Map<string, ItemAttribution>();
  for (const item of gear) {
    if (!item.name) continue;
    byName.set(item.name, {
      itemName: item.name,
      slot: item.slot,
      contributions: [],
    });
  }

  for (const attribution of attributions) {
    if (!attribution.matchesSheet) continue;

    for (const contribution of attribution.contributions) {
      if (contribution.sourceKind !== "item" || !contribution.itemName) continue;
      const target = byName.get(contribution.itemName);
      if (!target) continue;

      let row = target.contributions.find((c) => c.stat === attribution.stat);
      if (!row) {
        row = { stat: attribution.stat, flat: 0, increased: 0, without: 0 };
        target.contributions.push(row);
      }
      if (contribution.kind === "flat") row.flat += contribution.value;
      else row.increased += contribution.value;
    }

    // Recompute "without this item" once the item's whole share is known.
    for (const target of byName.values()) {
      const row = target.contributions.find((c) => c.stat === attribution.stat);
      if (!row) continue;
      const base = attribution.base - row.flat;
      const inc = attribution.increasedPercent - row.increased;
      row.without = Math.round(base * (1 + inc / 100));
    }
  }

  return [...byName.values()]
    .filter((entry) => entry.contributions.length > 0)
    .map((entry) => ({
      ...entry,
      contributions: entry.contributions.sort((a, b) => b.flat - a.flat),
    }));
}

/** Look up one stat's attribution. */
export function attributionFor(
  attributions: StatAttribution[],
  stat: AttributableStat
): StatAttribution | null {
  return attributions.find((a) => a.stat === stat) ?? null;
}
