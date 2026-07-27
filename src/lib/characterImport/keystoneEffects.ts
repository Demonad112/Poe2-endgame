import type { PassiveNode } from "./passiveNodes";
import type { DefensiveStats } from "./types";

/**
 * What an allocated keystone invalidates about the rest of the analysis.
 *
 * Several PoE2 keystones don't merely change a number — they make an entire
 * piece of advice wrong. Chaos Inoculation sets maximum life to 1 and grants
 * chaos immunity, so "low chaos resistance" and "thin life pool" are both
 * nonsense on that build. Eldritch Battery converts all energy shield to
 * mana, so counting ES as a defensive pool overstates survivability. Before
 * this, the tool had no way to know, and stated those conclusions anyway.
 *
 * Every entry is justified by the keystone's own stat text (from
 * psg_passive_nodes.json), quoted in `basis`, rather than by assuming PoE1
 * behaviour — several of these keystones differ from their PoE1 namesakes.
 */
export interface KeystoneEffects {
  /** Chaos damage cannot hurt this character; chaos resistance is moot. */
  chaosImmune: boolean;
  /** Maximum life is fixed at 1 — it is not a defensive pool. */
  lifeIsNegligible: boolean;
  /** Energy shield has been converted away; it is not a defensive pool. */
  esNotDefensive: boolean;
  /** Evasion rating functions as armour. */
  evasionIsArmour: boolean;
  /** This character cannot crit; crit modifiers do nothing. */
  neverCrits: boolean;
  /** Only fire damage is dealt; other added-damage modifiers do nothing. */
  fireOnly: boolean;
  /** Amulet modifiers benefit minions rather than the character. */
  amuletToMinions: boolean;
  /** Plain-language consequences worth showing, whatever else they change. */
  notes: KeystoneNote[];
  /** Allocated keystones whose effect the stats do not corroborate. */
  unverified: UnverifiedKeystone[];
}

export interface KeystoneNote {
  keystone: string;
  text: string;
}

/**
 * A keystone allocated on the tree whose effect is not visible in the
 * character's actual stats, so none of its corrections were applied.
 */
export interface UnverifiedKeystone {
  keystone: string;
  /** What we expected to see, and what we saw instead. */
  reason: string;
}

interface KeystoneRule {
  effects?: Partial<Omit<KeystoneEffects, "notes" | "unverified">>;
  /** Shown to the player as a consequence of having allocated this. */
  note?: string;
  /**
   * Confirm the keystone is actually in effect before trusting it.
   *
   * A node id appearing in the Path of Building export's allocated list is
   * NOT proof the keystone is doing anything. A real ladder character was
   * found with Chaos Inoculation's node allocated in its only active spec
   * while both poe.ninja and PoB reported 1,823 life and 54% chaos
   * resistance — the exact numbers the keystone forbids. Applying its
   * corrections there would have cut 1,823 from the defensive pool,
   * suppressed useful life upgrades, and claimed immunity to a damage type
   * the character plainly takes.
   *
   * So where a keystone's effect is observable in the stats we already have,
   * it must be observed. Returning a string means "not corroborated", and
   * that string explains what was seen instead.
   */
  verify?: (stats: DefensiveStats) => string | null;
}

// Keyed by keystone name. Only keystones that change how another part of this
// tool should be read are listed; the rest are still displayed, just without
// a correction attached.
const RULES: Record<string, KeystoneRule> = {
  "Chaos Inoculation": {
    effects: { chaosImmune: true, lifeIsNegligible: true },
    note: "Maximum life is 1 and you are immune to chaos damage and bleeding, so chaos resistance is irrelevant and energy shield is your entire pool.",
    verify: (s) =>
      s.life > 1
        ? `maximum life reads ${s.life.toLocaleString()}, but this keystone fixes it at 1`
        : null,
  },
  "Eldritch Battery": {
    effects: { esNotDefensive: true },
    note: "All energy shield is converted to mana, so it is not absorbing hits — your defensive pool is life and ward only.",
    verify: (s) =>
      s.energyShield > 0
        ? `energy shield reads ${s.energyShield.toLocaleString()}, but this keystone converts all of it to mana`
        : null,
  },
  "Iron Reflexes": {
    effects: { evasionIsArmour: true },
    note: "All evasion rating is converted to armour, so evasion is not avoiding hits — it is mitigating them.",
    verify: (s) =>
      s.evasionRating > 0
        ? `evasion rating reads ${s.evasionRating.toLocaleString()}, but this keystone converts all of it to armour`
        : null,
  },
  "Resolute Technique": {
    effects: { neverCrits: true },
    note: "You never deal critical hits, so critical chance and critical damage modifiers do nothing. Accuracy is doubled instead.",
  },
  "Avatar of Fire": {
    effects: { fireOnly: true },
    note: "You deal no non-fire damage, so added cold, lightning and chaos damage modifiers do nothing.",
  },
  "Necromantic Talisman": {
    effects: { amuletToMinions: true },
    note: "Every bonus on your equipped amulet applies to your minions instead of you.",
  },
  "Mind Over Matter": {
    note: "All damage is taken from mana before life, so your effective pool is larger than life and energy shield alone suggest — and mana recovery is 50% slower.",
  },
  "Blood Magic": {
    note: "You have no mana and skills cost life, so part of your life pool is a resource rather than a buffer.",
  },
  "Zealot's Oath": {
    note: "Energy shield does not recharge, so your ES pool does not come back on its own between fights.",
  },
  "Eternal Youth": {
    note: "Life recharges instead of energy shield, and flask life recovery is halved.",
  },
  "Trusted Kinship": {
    note: "You have 30% less defences, which is already reflected in the figures shown.",
  },
  "Giant's Blood": {
    note: "Martial weapon attribute requirements are tripled and inherent life from strength is halved.",
  },
  "Glancing Blows": {
    note: "Your chance to evade is unlucky (rolled twice, worse result taken), so evasion performs worse than its raw number suggests.",
  },
  Bulwark: {
    note: "Dodge roll cannot avoid damage, but you take 30% less damage from hits while dodge rolling.",
  },
  "Hollow Palm Technique": {
    note: "This build attacks unarmed, so modifiers on a wielded weapon may not be contributing.",
  },
  "Unwavering Stance": {
    note: "You cannot dodge roll or sprint, and cannot be light stunned.",
  },
  "Vaal Pact": {
    note: "Life leech is instant and life flasks cannot be used.",
  },
};

export const NO_KEYSTONE_EFFECTS: KeystoneEffects = {
  chaosImmune: false,
  lifeIsNegligible: false,
  esNotDefensive: false,
  evasionIsArmour: false,
  neverCrits: false,
  fireOnly: false,
  amuletToMinions: false,
  notes: [],
  unverified: [],
};

/**
 * Fold every allocated keystone into one set of corrections, applying a
 * keystone's effects only when the character's stats corroborate them.
 */
export function keystoneEffectsOf(
  keystones: PassiveNode[],
  stats?: DefensiveStats
): KeystoneEffects {
  const out: KeystoneEffects = {
    ...NO_KEYSTONE_EFFECTS,
    notes: [],
    unverified: [],
  };

  for (const keystone of keystones) {
    const rule = RULES[keystone.n];
    if (!rule) continue;

    const mismatch = rule.verify && stats ? rule.verify(stats) : null;
    if (mismatch) {
      // Allocated but not doing what it claims. Neither its corrections nor
      // its note can be trusted, so record the discrepancy instead — a note
      // stating "maximum life is 1" beside a life of 1,823 is worse than
      // silence.
      out.unverified.push({ keystone: keystone.n, reason: mismatch });
      continue;
    }

    if (rule.effects) Object.assign(out, rule.effects);
    if (rule.note) out.notes.push({ keystone: keystone.n, text: rule.note });
  }

  out.notes.sort((a, b) => a.keystone.localeCompare(b.keystone));
  out.unverified.sort((a, b) => a.keystone.localeCompare(b.keystone));
  return out;
}

/**
 * The defensive pool, with keystone conversions applied.
 *
 * Naively summing life + ES + ward is wrong on any build that has converted
 * one of them away, and wrong in the dangerous direction: it reports a bigger
 * buffer than the character has.
 */
export function effectivePool(
  stats: { life: number; energyShield: number; ward: number },
  effects: KeystoneEffects
): { total: number; excluded: string[] } {
  const excluded: string[] = [];
  let total = stats.ward;

  if (effects.lifeIsNegligible) excluded.push("life");
  else total += stats.life;

  if (effects.esNotDefensive) excluded.push("energy shield");
  else total += stats.energyShield;

  return { total, excluded };
}
