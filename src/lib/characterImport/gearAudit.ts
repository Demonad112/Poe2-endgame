import type { GearItem, ImportedCharacter, StructuredMod } from "./types";
import { NO_KEYSTONE_EFFECTS, type KeystoneEffects } from "./keystoneEffects";
import {
  bestRowForIlvl,
  displayTierOf,
  rowForTier,
  splitModId,
  type ModTierTable,
} from "./modTiers";

export interface TierUpgrade {
  itemName: string;
  itemSlot: string;
  itemLevel: number;
  /** Readable stat this mod grants, e.g. "maximum Energy Shield". */
  statLabel: string;
  /** Raw stat id, so consumers can classify without parsing the label. */
  statId: string;
  affixName: string | null;
  /** Tier as the game displays it, where T1 is the strongest. */
  currentTier: number;
  currentValue: number;
  /** Best displayed tier this item level can reach (lower is better). */
  bestTier: number;
  bestMin: number;
  bestMax: number;
  /** Rough headroom: best-tier ceiling vs what's rolled now. */
  gainMax: number;
  /** Lower sorts first: core defence/damage ahead of utility. */
  priority: number;
}

export interface QuestionableMod {
  itemName: string;
  itemSlot: string;
  text: string;
  reason: string;
}

export type Archetype = "attack" | "spell" | "unknown";

export interface GearAudit {
  archetype: Archetype;
  archetypeBasis: string;
  weaponType: string | null;
  upgrades: TierUpgrade[];
  questionable: QuestionableMod[];
  /** Mods that carried a tier we could grade. */
  gradedCount: number;
}

// Only stats worth surfacing an upgrade for — raw defensive and offensive
// rolls. Anything not listed is still parsed, just not nagged about.
const STAT_LABELS: Record<string, string> = {
  base_maximum_life: "maximum Life",
  base_maximum_mana: "maximum Mana",
  local_energy_shield: "Energy Shield",
  "local_energy_shield_+%": "increased Energy Shield",
  base_maximum_energy_shield: "maximum Energy Shield",
  local_base_evasion_rating: "Evasion Rating",
  "evasion_rating_+%": "increased Evasion",
  "local_evasion_and_energy_shield_+%": "Evasion and Energy Shield",
  local_base_armour: "Armour",
  "armour_+%": "increased Armour",
  accuracy_rating: "Accuracy Rating",
  "attack_speed_+%": "Attack Speed",
  "cast_speed_+%": "Cast Speed",
  "spell_damage_+%": "Spell Damage",
  "local_physical_damage_+%": "increased Physical Damage",
  attack_minimum_added_physical_damage: "added Physical Damage",
  attack_minimum_added_fire_damage: "added Fire Damage",
  attack_minimum_added_cold_damage: "added Cold Damage",
  attack_minimum_added_lightning_damage: "added Lightning Damage",
  "attack_critical_strike_chance_+%": "Attack Critical Chance",
  attack_critical_strike_multiplier_: "Attack Critical Damage",
  "base_item_found_rarity_+%": "increased Rarity",
  "mana_regeneration_rate_+%": "Mana Regeneration",
  base_spirit_from_equipment: "Spirit",
  additional_strength: "Strength",
  additional_dexterity: "Dexterity",
  additional_intelligence: "Intelligence",
  "base_movement_velocity_+%": "Movement Speed",
  base_stun_threshold: "Stun Threshold",
  "stun_threshold_+": "Stun Threshold",
  base_physical_damage_reduction_rating: "Armour",
  local_physical_damage_reduction_rating: "Armour",
  "local_attack_speed_+%": "Attack Speed",
  local_minimum_added_physical_damage: "added Physical Damage",
  local_maximum_added_physical_damage: "added Physical Damage",
  local_minimum_added_cold_damage: "added Cold Damage",
  local_maximum_added_cold_damage: "added Cold Damage",
  local_minimum_added_fire_damage: "added Fire Damage",
  local_maximum_added_fire_damage: "added Fire Damage",
  local_minimum_added_lightning_damage: "added Lightning Damage",
  local_maximum_added_lightning_damage: "added Lightning Damage",
  attack_maximum_added_physical_damage: "added Physical Damage",
  attack_maximum_added_fire_damage: "added Fire Damage",
  attack_maximum_added_cold_damage: "added Cold Damage",
  attack_maximum_added_lightning_damage: "added Lightning Damage",
  "attack_critical_strike_multiplier_+": "Attack Critical Damage",
  "damage_+%_with_bow_skills": "Bow Damage",
  "base_arrow_speed_+%": "Arrow Speed",
  base_life_gained_on_enemy_death: "Life on Kill",
  "local_attribute_requirements_+%": "Attribute Requirements",
  projectile_skill_gem_level_: "Projectile Gem Level",
  "projectile_skill_gem_level_+": "Projectile Gem Level",
  "local_base_evasion_rating_+%": "increased Evasion",
  "base_fire_damage_resistance_%": "Fire Resistance",
  "base_cold_damage_resistance_%": "Cold Resistance",
  "base_lightning_damage_resistance_%": "Lightning Resistance",
  "base_chaos_damage_resistance_%": "Chaos Resistance",
};

const WEAPON_KINDS = [
  "bow",
  "crossbow",
  "mace",
  "sword",
  "axe",
  "claw",
  "dagger",
  "quarterstaff",
  "staff",
  "wand",
  "sceptre",
  "spear",
  "flail",
];

function labelFor(statId: string): string {
  const known = STAT_LABELS[statId];
  if (known) return known;
  // Fall back to a tidied form of the raw stat id rather than showing the
  // engine's internal naming verbatim.
  return statId
    .replace(/^(local|base|attack|global)_/, "")
    .replace(/_\+?%?$/, "")
    .replace(/_\+/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Rough ordering of what's worth fixing first. Core survivability and damage
// outrank utility rolls, so a big tier gap on mana doesn't bury a smaller one
// on life. Within a group, the larger tier jump wins.
const STAT_PRIORITY: [RegExp, number][] = [
  [/maximum_life|energy_shield|evasion|armour|physical_damage_reduction|resistance|stun_threshold/, 0],
  [/damage|critical|attack_speed|cast_speed|accuracy|gem_level/, 1],
  [/spirit|life_gained|regeneration/, 2],
];

function priorityOf(statId: string): number {
  for (const [re, rank] of STAT_PRIORITY) if (re.test(statId)) return rank;
  return 3;
}

function gradeable(mod: StructuredMod): boolean {
  // Implicits come from the base item, not the affix pool, so their tier
  // numbers aren't on the same scale and they can't be re-rolled in place.
  return mod.category !== "implicit" && mod.category !== "rune";
}

function detectWeapon(gear: GearItem[]): string | null {
  const weapon = gear.find((g) => g.slot === "Main Hand");
  if (!weapon) return null;
  const base = weapon.base.toLowerCase();
  return WEAPON_KINDS.find((k) => base.includes(k)) ?? null;
}

/**
 * Infer whether the build hits with attacks or spells. Deliberately
 * conservative: unless one side clearly dominates we return "unknown" and
 * skip every archetype-dependent flag, because a wrong call here produces
 * confidently wrong advice.
 */
function detectArchetype(
  character: ImportedCharacter
): { archetype: Archetype; basis: string } {
  let attack = 0;
  let spell = 0;
  for (const item of character.gear) {
    for (const mod of item.structuredMods ?? []) {
      for (const statId of Object.keys(mod.stats)) {
        if (/^attack_|accuracy_rating|_with_bow_skills/.test(statId)) attack += 1;
        if (/^spell_|^cast_speed|spell_damage/.test(statId)) spell += 1;
      }
    }
  }
  const accuracy = character.pob?.accuracy ?? 0;
  if (accuracy > 0) attack += 2;

  if (attack >= 3 && attack > spell * 2) {
    return {
      archetype: "attack",
      basis: `${attack} attack-scaling signals on your gear${accuracy > 0 ? ` and ${accuracy.toLocaleString()} accuracy` : ""}`,
    };
  }
  if (spell >= 3 && spell > attack * 2) {
    return { archetype: "spell", basis: `${spell} spell-scaling modifiers on your gear` };
  }
  return {
    archetype: "unknown",
    basis: "not enough one-sided evidence to call this an attack or spell build",
  };
}

export function auditGear(
  character: ImportedCharacter,
  table: ModTierTable,
  keystones: KeystoneEffects = NO_KEYSTONE_EFFECTS
): GearAudit {
  const { archetype, basis } = detectArchetype(character);
  const weaponType = detectWeapon(character.gear);
  const upgrades: TierUpgrade[] = [];
  const questionable: QuestionableMod[] = [];
  let gradedCount = 0;

  for (const item of character.gear) {
    // Weapon-swap slots are a secondary setup, not what you're playing, and
    // their (often much lower) item levels produce large but irrelevant tier
    // gaps that would crowd out the gear actually in use.
    if (/\(Swap\)/i.test(item.slot)) continue;

    // Necromantic Talisman redirects the entire amulet, so flag the item once
    // rather than repeating the same reason for every modifier on it.
    if (keystones.amuletToMinions && item.slot === "Amulet") {
      questionable.push({
        itemName: item.name,
        itemSlot: item.slot,
        text: "Every modifier on this amulet",
        reason:
          "Necromantic Talisman applies all amulet bonuses to your minions instead of you.",
      });
    }

    for (const mod of item.structuredMods ?? []) {
      const statIds = Object.keys(mod.stats);

      // --- Mods that may be doing nothing for this build ---
      for (const statId of statIds) {
        const weaponMatch = /_with_(\w+?)_skills$/.exec(statId);
        if (weaponMatch && weaponType) {
          const needed = weaponMatch[1].replace(/s$/, "");
          if (!weaponType.includes(needed) && !needed.includes(weaponType)) {
            questionable.push({
              itemName: item.name,
              itemSlot: item.slot,
              text: labelFor(statId),
              reason: `Only applies to ${needed} skills, but you're wielding a ${weaponType}.`,
            });
          }
        }
        if (archetype === "attack" && /^spell_|^cast_speed/.test(statId)) {
          questionable.push({
            itemName: item.name,
            itemSlot: item.slot,
            text: labelFor(statId),
            reason: "Scales spells, and this reads as an attack build.",
          });
        }
        if (archetype === "spell" && /^attack_|accuracy_rating/.test(statId)) {
          questionable.push({
            itemName: item.name,
            itemSlot: item.slot,
            text: labelFor(statId),
            reason: "Scales attacks, and this reads as a spell build.",
          });
        }
        if (/^minion_/.test(statId)) {
          questionable.push({
            itemName: item.name,
            itemSlot: item.slot,
            text: labelFor(statId),
            reason: "Only affects minions.",
          });
        }

        // --- Keystone-driven dead modifiers ---
        // These are certainties rather than inferences: the keystone's own
        // text says the modifier cannot do anything.
        if (keystones.neverCrits && /critical/.test(statId)) {
          questionable.push({
            itemName: item.name,
            itemSlot: item.slot,
            text: labelFor(statId),
            reason:
              "Resolute Technique means you never deal critical hits, so this does nothing.",
          });
        }
        if (
          keystones.fireOnly &&
          /added_(cold|lightning|chaos)_damage|(cold|lightning|chaos)_damage_\+%/.test(
            statId
          )
        ) {
          questionable.push({
            itemName: item.name,
            itemSlot: item.slot,
            text: labelFor(statId),
            reason:
              "Avatar of Fire means you deal no non-fire damage, so this does nothing.",
          });
        }
        if (keystones.chaosImmune && /base_maximum_life|life_regeneration/.test(statId)) {
          questionable.push({
            itemName: item.name,
            itemSlot: item.slot,
            text: labelFor(statId),
            reason:
              "Chaos Inoculation fixes maximum life at 1, so life modifiers do nothing.",
          });
        }
      }

      // --- Tier headroom ---
      if (!gradeable(mod) || item.itemLevel <= 0) continue;
      const split = splitModId(mod.id);
      if (!split) continue;
      const family = table[split.family];
      if (!family) continue;
      const currentRow = rowForTier(family, split.tier);
      const bestRow = bestRowForIlvl(family, item.itemLevel);
      if (!currentRow || !bestRow) continue;
      gradedCount += 1;
      if (bestRow.t <= split.tier) continue;
      const currentDisplay = displayTierOf(family, currentRow);
      const bestDisplay = displayTierOf(family, bestRow);
      if (bestDisplay >= currentDisplay) continue;

      // Report against the mod's primary stat, matched by id where possible.
      const primary =
        bestRow.s.find(([sid]) => sid in mod.stats) ?? bestRow.s[0];
      if (!primary) continue;
      const [statId, bestMin, bestMax] = primary;
      const currentValue = mod.stats[statId] ?? 0;
      if (bestMax === null || bestMin === null) continue;

      upgrades.push({
        itemName: item.name,
        itemSlot: item.slot,
        itemLevel: item.itemLevel,
        statLabel: labelFor(statId),
        statId,
        affixName: family.n,
        currentTier: currentDisplay,
        currentValue,
        bestTier: bestDisplay,
        bestMin,
        bestMax,
        gainMax: bestMax - currentValue,
        priority: priorityOf(statId),
      });
    }
  }

  upgrades.sort(
    (a, b) =>
      a.priority - b.priority ||
      b.currentTier - b.bestTier - (a.currentTier - a.bestTier)
  );
  return {
    archetype,
    archetypeBasis: basis,
    weaponType,
    upgrades,
    questionable,
    gradedCount,
  };
}
