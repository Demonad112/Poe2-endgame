import type { ImportedCharacter } from "./types";
import { assessBuild, type BuildAssessment } from "./buildScore";
import { analyseResistances, type ResistanceAdvice } from "./resistanceAdvice";
import { auditGear, type GearAudit, type TierUpgrade } from "./gearAudit";
import type { ModTierTable } from "./modTiers";
import { RESIST_LABEL, RESIST_STAT_ID } from "./resistanceTiers";
import {
  resolvePassives,
  type PassiveNodeTable,
  type ResolvedPassives,
} from "./passiveNodes";
import {
  effectivePool,
  keystoneEffectsOf,
  NO_KEYSTONE_EFFECTS,
  type KeystoneEffects,
} from "./keystoneEffects";
import {
  CHAOS_CRITICAL,
  DPS_LOW,
  DPS_OK,
  ONE_SHOT_RATIO,
  POOL_THIN,
  type ResistanceKey,
} from "./thresholds";

/**
 * One ranked pass over everything we know about a character.
 *
 * The panels on the character page each ran their own analysis and rendered
 * it independently, which produced advice that contradicted itself: the
 * resistance panel told a player to trade away Lightning Resistance on a ring
 * (8% over cap), while the gear audit — 1,400px further down — listed
 * upgrading that exact modifier on that exact ring as a top change. Neither
 * was wrong in isolation; nothing was responsible for reconciling them.
 *
 * This module is that responsibility. Every panel's findings become candidate
 * actions, conflicts are resolved here, and what survives is ranked by
 * estimated impact on the character rather than by whatever each panel
 * happened to sort by.
 */

export type ActionSeverity = "critical" | "important" | "opportunity";

export interface Action {
  id: string;
  /** Imperative, e.g. "Cap Cold Resistance". */
  title: string;
  /** What to actually do. */
  detail: string;
  /** Why it's worth doing, in the player's terms. */
  why: string;
  severity: ActionSeverity;
  /** Estimated impact, 0-100. Ranking only — never shown as a score. */
  score: number;
  itemName?: string;
  itemSlot?: string;
  /** Which panel holds the supporting detail, for "see below" links. */
  evidence: string;
}

export interface CharacterAnalysis {
  assessment: BuildAssessment;
  resistances: ResistanceAdvice;
  /** Null until the affix tier table has loaded (or if it failed to). */
  gear: GearAudit | null;
  /** Null until the passive node table has loaded, or if there are no nodes. */
  passives: ResolvedPassives | null;
  /** Corrections implied by allocated keystones. */
  keystones: KeystoneEffects;
  /** Defensive pool with keystone conversions applied — not a naive sum. */
  pool: number;
  /** Ranked, deduplicated, conflict-resolved. */
  actions: Action[];
  /** True when the tier table is still pending, so gear actions may be missing. */
  gearPending: boolean;
}

// --- Impact model -----------------------------------------------------------
//
// Scores are a deliberately coarse ordering device, not a measurement. What
// matters is that categories rank sanely against each other: an uncapped
// resistance always outranks a tier upgrade, and a tier upgrade on a stat the
// build actually uses always outranks one on a stat it doesn't.
//
// The previous gear ranking sorted purely by tier gap, which put "Stun
// Threshold T5 -> T1" above "maximum Life T4 -> T1" on the test character.
// Tier gap measures how far an item is from perfect; it says nothing about
// whether the stat matters.

const SCORE = {
  uncappedElemental: 90,
  oneShotRisk: 84,
  negativeChaos: 80,
  thinPool: 70,
  lowDps: 64,
  chaosBelowTarget: 42,
  modestDps: 34,
  deadMod: 22,
} as const;

/** Base impact for a tier upgrade, by what the stat does for the build. */
const UPGRADE_BASE = {
  shortResistance: 60,
  lifeOrEs: 46,
  relevantDamage: 32,
  mitigation: 26,
  utility: 8,
} as const;

const LIFE_ES_RE = /maximum_life|energy_shield/;
const MITIGATION_RE = /evasion|armour|physical_damage_reduction|stun_threshold/;
const DAMAGE_RE =
  /damage|critical|attack_speed|cast_speed|accuracy|gem_level|penetration/;

function resistanceKeyOf(statId: string): ResistanceKey | null {
  return RESIST_STAT_ID[statId] ?? null;
}

/**
 * Impact of a single tier upgrade, given what the build needs.
 *
 * Returns null when the upgrade should not be offered at all — currently that
 * means a resistance already at or above its target, which is the specific
 * case that produced the contradictory lightning advice.
 */
function scoreUpgrade(
  upgrade: TierUpgrade,
  shortfalls: Map<ResistanceKey, number>,
  cappedOrOver: Set<ResistanceKey>,
  archetypeMatches: boolean,
  keystones: KeystoneEffects
): number | null {
  const resKey = resistanceKeyOf(upgrade.statId);

  if (resKey) {
    // Raising a resistance that is already at or over its target is at best
    // wasted currency and at worst directly contradicts the advice to spend
    // that surplus elsewhere. Don't offer it.
    if (cappedOrOver.has(resKey)) return null;
    // Chaos immunity makes chaos resistance worthless at any tier.
    if (resKey === "chaos" && keystones.chaosImmune) return null;
    const shortfall = shortfalls.get(resKey) ?? 0;
    return UPGRADE_BASE.shortResistance + Math.min(20, shortfall);
  }

  // A keystone can make a whole stat dead. Suggesting a tier upgrade on a
  // modifier the build cannot benefit from is the same error as suggesting an
  // over-capped resistance — currency spent for nothing.
  //
  // Only genuinely dead stats are suppressed. Energy shield under Eldritch
  // Battery is deliberately NOT one of them: it converts to mana rather than
  // vanishing, so it stops counting as a defensive pool while remaining worth
  // rolling. Excluding it from the pool is the correction; hiding the upgrade
  // would be an overcorrection.
  if (keystones.lifeIsNegligible && /maximum_life|life_regeneration/.test(upgrade.statId))
    return null;
  if (keystones.neverCrits && /critical/.test(upgrade.statId)) return null;

  let base: number;
  if (LIFE_ES_RE.test(upgrade.statId)) base = UPGRADE_BASE.lifeOrEs;
  else if (DAMAGE_RE.test(upgrade.statId))
    base = archetypeMatches ? UPGRADE_BASE.relevantDamage : UPGRADE_BASE.utility;
  else if (MITIGATION_RE.test(upgrade.statId)) base = UPGRADE_BASE.mitigation;
  else base = UPGRADE_BASE.utility;

  // A bigger tier gap is worth slightly more, but only as a tie-breaker
  // within a category — never enough to lift utility above life.
  const gap = Math.max(0, upgrade.currentTier - upgrade.bestTier);
  return base + Math.min(6, gap);
}

function severityFor(score: number): ActionSeverity {
  if (score >= 70) return "critical";
  if (score >= 40) return "important";
  return "opportunity";
}

export function analyseCharacter(
  character: ImportedCharacter,
  table: ModTierTable | null,
  passiveTable: PassiveNodeTable | null = null
): CharacterAnalysis {
  const { stats, pob } = character;

  // Keystones come first: several of them invalidate conclusions the rest of
  // this function would otherwise draw, so nothing below runs without them.
  const passives = resolvePassives(pob?.allocatedNodes, passiveTable);
  const keystones = passives
    ? keystoneEffectsOf(passives.keystones)
    : NO_KEYSTONE_EFFECTS;

  const assessment = assessBuild(character, keystones);
  const resistances = analyseResistances(character);
  const gear = table ? auditGear(character, table, keystones) : null;

  const shortfalls = new Map<ResistanceKey, number>();
  const cappedOrOver = new Set<ResistanceKey>();
  for (const status of resistances.statuses) {
    if (status.shortfall > 0) shortfalls.set(status.type, status.shortfall);
    else cappedOrOver.add(status.type);
  }

  const actions: Action[] = [];

  // --- Uncapped elemental resistance ---------------------------------------
  // The single most reliably worth-fixing thing in the game, so it leads
  // whenever it applies. Detail comes from the resistance advice, which knows
  // which item can actually host the fix.
  for (const status of resistances.statuses) {
    if (status.type === "chaos" || status.shortfall <= 0) continue;
    const label = RESIST_LABEL[status.type];
    const fix = resistances.suggestions.find(
      (s) => s.severity === "critical" && s.title.includes(`${label} Resistance`)
    );
    actions.push({
      id: `res-${status.type}`,
      title: `Cap ${label} Resistance — ${status.shortfall}% short`,
      detail:
        fix?.detail ??
        `${label} Resistance is at ${status.current}%, ${status.shortfall}% below the 75% cap.`,
      why: `Every point below cap is elemental damage taken in full, on every hit, in every map.`,
      severity: "critical",
      score: SCORE.uncappedElemental + status.shortfall,
      itemName: fix?.itemName,
      itemSlot: fix?.itemSlot,
      evidence: "Resistance tuning",
    });
  }

  // --- One-shot risk --------------------------------------------------------
  if (pob) {
    const hits = (
      [
        ["Physical", pob.maxHitTaken.physical],
        ["Fire", pob.maxHitTaken.fire],
        ["Cold", pob.maxHitTaken.cold],
        ["Lightning", pob.maxHitTaken.lightning],
        ["Chaos", pob.maxHitTaken.chaos],
      ] as [string, number][]
    ).filter(([, v]) => v > 0);
    const best = hits.reduce((max, [, v]) => Math.max(max, v), 0);
    const atRisk = hits
      // Chaos immunity makes a low chaos max-hit meaningless — it was the
      // lowest number on the test character and would otherwise lead the
      // list on a build that literally cannot take chaos damage.
      .filter(([type]) => !(keystones.chaosImmune && type === "Chaos"))
      .filter(([, v]) => v < best * ONE_SHOT_RATIO)
      .sort((a, b) => a[1] - b[1]);

    if (atRisk.length > 0) {
      const names = atRisk.map(([t]) => t);
      actions.push({
        id: "one-shot",
        title:
          atRisk.length === 1
            ? `Shore up ${names[0]} — it is the one-shot risk`
            : `Shore up ${names.join(" and ")} — ${atRisk.length} one-shot risks`,
        detail: atRisk
          .map(([t, v]) => `${t} caps out at ${v.toLocaleString()}`)
          .concat(`the best type absorbs ${best.toLocaleString()}`)
          .join("; "),
        why:
          atRisk.length === 1
            ? "A hit of that type larger than this kills outright, regardless of how healthy the pool looks."
            : "Each of these dies to a hit the others would survive. Physical and elemental hits are far more common than chaos, so treat them in that order.",
        severity: "critical",
        score: SCORE.oneShotRisk,
        evidence: "Max hit survivable",
      });
    }
  }

  // --- Chaos resistance -----------------------------------------------------
  // Skipped entirely under chaos immunity: telling a Chaos Inoculation build
  // to raise chaos resistance is advice to spend currency on nothing.
  const chaos = resistances.statuses.find((s) => s.type === "chaos");
  if (chaos && chaos.shortfall > 0 && !keystones.chaosImmune) {
    const critical = chaos.current < CHAOS_CRITICAL;
    const fix = resistances.suggestions.find((s) =>
      s.title.includes("Chaos Resistance")
    );
    actions.push({
      id: "res-chaos",
      title: critical
        ? `Fix negative Chaos Resistance (${chaos.current}%)`
        : `Raise Chaos Resistance — ${chaos.current}%, ${chaos.shortfall}% under target`,
      detail:
        fix?.detail ??
        `Chaos Resistance is at ${chaos.current}%. There is no 75% cap for chaos; the target used here is a judgement call.`,
      why: critical
        ? "Negative chaos resistance amplifies every chaos hit and poison stack taken."
        : "Chaos damage bypasses energy shield, so a thin chaos resistance hits ES-based builds hardest.",
      severity: critical ? "critical" : "important",
      score: critical ? SCORE.negativeChaos : SCORE.chaosBelowTarget,
      itemName: fix?.itemName,
      itemSlot: fix?.itemSlot,
      evidence: "Resistance tuning",
    });
  }

  // --- Defensive pool -------------------------------------------------------
  // Counts only what actually absorbs hits. A build that converted its energy
  // shield to mana, or whose maximum life is fixed at 1, does not have the
  // pool a naive life + ES + ward sum reports — and the error runs in the
  // dangerous direction, claiming a bigger buffer than exists.
  const { total: pool, excluded } = effectivePool(stats, keystones);
  if (pool < POOL_THIN) {
    const onlyOne = keystones.lifeIsNegligible || keystones.esNotDefensive;
    const growable = keystones.lifeIsNegligible
      ? "Energy Shield"
      : keystones.esNotDefensive
        ? "maximum Life"
        : "maximum Life or Energy Shield";
    actions.push({
      id: "thin-pool",
      title: `Grow the defensive pool — ${pool.toLocaleString()} combined`,
      detail:
        `Look for ${growable} on any slot still rolling ${onlyOne ? "none" : "neither"}, and on the passive tree.` +
        (excluded.length > 0
          ? ` Your ${excluded.join(" and ")} is excluded here — a keystone has converted it away, so it is not absorbing hits.`
          : ""),
      why: "Resistances scale what you take per hit; the pool decides how many hits you get. Below roughly 4,000 combined, endgame hits leave no margin.",
      severity: "critical",
      score: SCORE.thinPool,
      evidence: "Defenses",
    });
  }

  // --- Offense --------------------------------------------------------------
  const dps = pob?.combinedDps ?? 0;
  if (pob && dps > 0 && dps < DPS_OK) {
    const low = dps < DPS_LOW;
    const versusBoss = pob.config?.versusBoss ?? false;
    actions.push({
      id: "dps",
      title: low
        ? `Damage is low for endgame — ${Math.round(dps).toLocaleString()} DPS`
        : `Damage is modest — ${Math.round(dps).toLocaleString()} DPS`,
      detail: versusBoss
        ? "This figure was calculated against a boss, so it reflects single-target damage directly."
        : "This figure was not calculated against a boss, so real single-target damage on pinnacle fights will differ — re-check in Path of Building with a boss configured before acting on it.",
      why: "Compared against rough endgame bands chosen for this tool, not a published community benchmark.",
      severity: low ? "important" : "opportunity",
      score: low ? SCORE.lowDps : SCORE.modestDps,
      evidence: "Offense",
    });
  }

  // --- Gear tier upgrades ---------------------------------------------------
  // A resistance that already has its own action above is fully owned by it:
  // that action states the shortfall and names the cheapest item that closes
  // it. Listing every other item that could also raise the same resistance
  // adds no decision — closing a 1% cold gap does not need four entries — so
  // the whole resistance is claimed, not just the item the action named.
  const claimedResistances = new Set<ResistanceKey>();
  for (const action of actions) {
    if (!action.id.startsWith("res-")) continue;
    const key = action.id.slice("res-".length) as ResistanceKey;
    claimedResistances.add(key);
  }

  if (gear) {
    for (const upgrade of gear.upgrades) {
      const resKey = resistanceKeyOf(upgrade.statId);
      if (resKey && claimedResistances.has(resKey)) continue;

      const archetypeMatches =
        gear.archetype === "unknown" ||
        (gear.archetype === "attack" && !/^spell_|^cast_speed/.test(upgrade.statId)) ||
        (gear.archetype === "spell" && !/^attack_|accuracy_rating/.test(upgrade.statId));

      const score = scoreUpgrade(
        upgrade,
        shortfalls,
        cappedOrOver,
        archetypeMatches,
        keystones
      );
      if (score === null) continue;

      actions.push({
        id: `upgrade-${upgrade.itemSlot}-${upgrade.statId}`,
        title: `Upgrade ${upgrade.statLabel} on ${upgrade.itemName} — T${upgrade.currentTier} to T${upgrade.bestTier}`,
        detail: `Currently ${upgrade.currentValue}. At item level ${upgrade.itemLevel} this slot can roll T${upgrade.bestTier} (${upgrade.bestMin}–${upgrade.bestMax})${upgrade.affixName ? `, the "${upgrade.affixName}" affix` : ""}.`,
        why: "T1 is the theoretical ceiling for this item level, not a realistic crafting target — treat the gap as headroom, not a defect.",
        severity: severityFor(score),
        score,
        itemName: upgrade.itemName,
        itemSlot: upgrade.itemSlot,
        evidence: "Gear audit",
      });
    }

    // --- Modifiers doing nothing -------------------------------------------
    for (const q of gear.questionable) {
      actions.push({
        id: `dead-${q.itemSlot}-${q.text}`,
        title: `${q.text} on ${q.itemName} may be doing nothing`,
        detail: q.reason,
        why: "A modifier that does not apply to your skills is an affix slot returning nothing.",
        severity: "opportunity",
        score: SCORE.deadMod,
        itemName: q.itemName,
        itemSlot: q.itemSlot,
        evidence: "Gear audit",
      });
    }
  }

  actions.sort((a, b) => b.score - a.score);

  return {
    assessment,
    resistances,
    gear,
    passives,
    keystones,
    pool,
    actions,
    gearPending: table === null,
  };
}
