import type { GearItem, ImportedCharacter, ResistanceGrant } from "./types";
import {
  RESIST_LABEL,
  RESIST_SUFFIX_NAME,
  bestTierForIlvl,
  displayTier,
  slotCanRollResistance,
  tierByNumber,
  type ResistanceType,
} from "./resistanceTiers";

const RES_CAP = 75;
/** Below this, chaos resistance is worth actively fixing. */
const CHAOS_TARGET = 30;

export interface ResistanceStatus {
  type: ResistanceType;
  current: number;
  /** Points above the cap (PoB's own overcap figure when available). */
  overCap: number;
  /** Points still needed to reach the cap; 0 when capped. */
  shortfall: number;
  /** Total this resistance receives from gear. */
  fromGear: number;
}

export type SuggestionKind = "upgrade-tier" | "reallocate" | "add-missing";

export interface Suggestion {
  kind: SuggestionKind;
  /** Item this action applies to, if any. */
  itemName?: string;
  itemSlot?: string;
  title: string;
  detail: string;
  severity: "critical" | "opportunity";
}

export interface ResistanceAdvice {
  statuses: ResistanceStatus[];
  suggestions: Suggestion[];
  /** True when the character model carried no structured item mod data. */
  noItemData: boolean;
}

// Persisted characters can predate fields added later, so every access to a
// stored array is guarded rather than assumed.
function grantsOf(item: GearItem): ResistanceGrant[] {
  return Array.isArray(item.resistances) ? item.resistances : [];
}

function gearTotal(gear: GearItem[], type: ResistanceType): number {
  return gear.reduce(
    (sum, item) =>
      sum + grantsOf(item).filter((r) => r.type === type).reduce((s, r) => s + r.value, 0),
    0
  );
}

interface Contribution {
  item: GearItem;
  grant: ResistanceGrant;
}

function contributions(gear: GearItem[], type: ResistanceType): Contribution[] {
  const out: Contribution[] = [];
  for (const item of gear) {
    for (const grant of grantsOf(item)) {
      if (grant.type === type) out.push({ item, grant });
    }
  }
  return out;
}

/**
 * Turn the resistance picture into concrete gear actions.
 *
 * Totals are deliberately NOT recomputed from gear — the game applies act
 * penalties and the passive tree contributes too, so PoB/poe.ninja's own
 * figures are treated as ground truth for what's capped. Gear data is used
 * only to attribute *where* a resistance comes from and what could change.
 */
export function analyseResistances(
  character: ImportedCharacter
): ResistanceAdvice {
  const { stats, gear, pob } = character;
  const current: Record<ResistanceType, number> = {
    fire: stats.fireResistance,
    cold: stats.coldResistance,
    lightning: stats.lightningResistance,
    chaos: stats.chaosResistance,
  };

  const statuses: ResistanceStatus[] = (
    ["fire", "cold", "lightning", "chaos"] as ResistanceType[]
  ).map((type) => {
    const value = current[type];
    const target = type === "chaos" ? CHAOS_TARGET : RES_CAP;
    return {
      type,
      current: value,
      overCap: type === "chaos" ? 0 : (pob?.resistOverCap[type] ?? Math.max(0, value - RES_CAP)),
      shortfall: Math.max(0, target - value),
      fromGear: gearTotal(gear, type),
    };
  });

  const hasItemData = gear.some((g) => grantsOf(g).length > 0);
  const suggestions: Suggestion[] = [];

  if (hasItemData) {
    // --- 1. Close a shortfall by upgrading an existing resistance mod ---
    for (const status of statuses) {
      if (status.shortfall <= 0) continue;
      const candidates = contributions(gear, status.type)
        .map(({ item, grant }) => {
          // Implicits come from the item base, not the suffix pool, so their
          // tier numbers aren't comparable and they can't be re-rolled.
          if (grant.category === "implicit") return null;
          if (grant.tier === null || item.itemLevel <= 0) return null;
          const best = bestTierForIlvl(status.type, item.itemLevel);
          const currentTier = tierByNumber(status.type, grant.tier);
          if (!best || !currentTier || best.tier <= grant.tier) return null;
          const curDisplay = displayTier(status.type, grant.tier);
          const bestDisplay = displayTier(status.type, best.tier);
          if (curDisplay === null || bestDisplay === null || bestDisplay >= curDisplay)
            return null;
          return {
            item,
            grant,
            best,
            curDisplay,
            bestDisplay,
            // Worst-case gain from moving to the better tier at its floor.
            minGain: best.min - grant.value,
            maxGain: best.max - grant.value,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && c.maxGain > 0)
        .sort((a, b) => b.maxGain - a.maxGain);

      for (const c of candidates.slice(0, 2)) {
        const label = RESIST_LABEL[status.type];
        const enough = c.minGain >= status.shortfall;
        suggestions.push({
          kind: "upgrade-tier",
          itemName: c.item.name,
          itemSlot: c.item.slot,
          severity: "critical",
          title: `Raise ${label} Resistance on ${c.item.name} to T${c.bestDisplay}`,
          detail:
            `It currently rolls T${c.curDisplay} at +${c.grant.value}%. At item level ${c.item.itemLevel} ` +
            `this slot can roll T${c.bestDisplay} (+${c.best.min}–${c.best.max}%), a gain of ` +
            `+${c.minGain}–${c.maxGain}%. You need +${status.shortfall}% to cap ${label}` +
            (enough
              ? ", so even the worst roll of that tier closes the gap."
              : ", so this helps but may not close it alone."),
        });
      }

      // Nothing on gear grants this resistance at all.
      if (candidates.length === 0 && contributions(gear, status.type).length === 0) {
        const host = gear
          .filter(
            (g) =>
              g.itemLevel > 0 &&
              g.rarity !== "Unique" &&
              slotCanRollResistance(g.slot, g.base)
          )
          .sort((a, b) => b.itemLevel - a.itemLevel)[0];
        const best = host ? bestTierForIlvl(status.type, host.itemLevel) : null;
        suggestions.push({
          kind: "add-missing",
          itemName: host?.name,
          itemSlot: host?.slot,
          severity: status.type === "chaos" ? "opportunity" : "critical",
          title: `No ${RESIST_LABEL[status.type]} Resistance anywhere on your gear`,
          detail: best && host
            ? `You're ${status.shortfall}% short. Your highest-level piece that can host one is ${host.name} ` +
              `(item level ${host.itemLevel}), which can roll T${displayTier(status.type, best.tier) ?? best.tier} "${RESIST_SUFFIX_NAME[status.type]}" ` +
              `at +${best.min}–${best.max}%` +
              (best.min >= status.shortfall ? " — enough on its own." : ".")
            : `You're ${status.shortfall}% short and no equipped item supplies it.`,
        });
      }
    }

    // --- 2. Spend surplus on what's missing ---
    // One suggestion per over-capped resistance, naming every shortfall it
    // could fund, rather than a separate near-identical entry per pairing.
    const surplus = statuses.filter((s) => s.overCap > 0);
    const needs = statuses.filter((s) => s.shortfall > 0);
    const needList = needs.map((n) => RESIST_LABEL[n.type]).join(" or ");

    for (const over of surplus) {
      if (needs.length === 0) continue;
      const overLabel = RESIST_LABEL[over.type];
      const sources = contributions(gear, over.type);
      const tradable = sources
        .filter(({ grant }) => grant.value <= over.overCap)
        .sort((a, b) => b.grant.value - a.grant.value);

      if (tradable.length > 0) {
        const { item, grant } = tradable[0];
        const target = needs[0];
        const best = bestTierForIlvl(target.type, item.itemLevel);
        const isImplicit = grant.category === "implicit";
        suggestions.push({
          kind: "reallocate",
          itemName: item.name,
          itemSlot: item.slot,
          severity: "opportunity",
          title: isImplicit
            ? `Swap ${item.name} for a base that grants ${needList} instead`
            : `Trade ${overLabel} Resistance on ${item.name} for ${needList}`,
          detail:
            `${overLabel} sits ${over.overCap}% over cap, and this ${grant.category} gives ` +
            `+${grant.value}% — the only source small enough to give up without dropping under the cap. ` +
            (isImplicit
              ? `It comes from the item's base type rather than a rollable suffix, so realising it means ` +
                `switching to an equivalent base whose implicit grants ${needList}.`
              : best
                ? `Re-rolling that suffix to ${RESIST_LABEL[target.type]} Resistance at item level ` +
                  `${item.itemLevel} lands T${displayTier(target.type, best.tier) ?? best.tier} (+${best.min}–${best.max}%).`
                : `Re-roll it to ${RESIST_LABEL[target.type]} Resistance.`),
        });
      } else {
        const smallest = [...sources].sort((a, b) => a.grant.value - b.grant.value)[0];
        if (smallest) {
          suggestions.push({
            kind: "reallocate",
            itemName: smallest.item.name,
            itemSlot: smallest.item.slot,
            severity: "opportunity",
            title: `${overLabel} is ${over.overCap}% over cap, but no single mod is small enough to trade`,
            detail:
              `Your smallest ${overLabel} source is +${smallest.grant.value}% on ${smallest.item.name}, ` +
              `more than the ${over.overCap}% you can spare, so removing it outright would drop you under cap. ` +
              `Dropping to a lower ${overLabel} tier there frees part of it toward ${needList} without losing the cap.`,
          });
        }
      }
    }

    // --- 3. Surplus with nothing needing it ---
    if (surplus.length > 0 && needs.length === 0) {
      const biggest = surplus.sort((a, b) => b.overCap - a.overCap)[0];
      suggestions.push({
        kind: "reallocate",
        severity: "opportunity",
        title: `${RESIST_LABEL[biggest.type]} is ${biggest.overCap}% over cap`,
        detail:
          `Everything is capped, so that headroom is only insurance against resistance-reducing ` +
          `map modifiers and enemies. If you'd rather bank it, that suffix could become life, ` +
          `energy shield, or damage instead.`,
      });
    }
  }

  return { statuses, suggestions, noItemData: !hasItemData };
}
