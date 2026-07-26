import type { PobConfig } from "./types";

// PoB stores its Configuration tab as <Input> elements under <Calcs>. Those
// inputs are part of what produced the <PlayerStat> values we display, so
// they're the difference between "this build does 110k DPS" and "this build
// does 110k DPS against a non-boss enemy that is chilled, ignited and
// bleeding, while you are moving and have crit recently".
//
// The page used to assert these figures came from "PoB's default config (no
// custom boss/buff settings applied)". On the real test character that was
// wrong twice over: 20 inputs were set, seven of them damage-relevant
// conditionals, and no boss setting existed at all — so the number was both
// inflated by conditionals and not a boss number, while the assessment used
// it to judge pinnacle-boss viability.

/**
 * Inputs that raise damage by assuming something is true about the enemy or
 * the player at the moment of the hit. Label is how PoB presents it.
 */
const CONDITIONAL_LABELS: Record<string, string> = {
  conditionEnemyChilled: "enemy is chilled",
  conditionEnemyFrozen: "enemy is frozen",
  conditionEnemyShocked: "enemy is shocked",
  conditionEnemyIgnited: "enemy is ignited",
  conditionEnemyBleeding: "enemy is bleeding",
  conditionEnemyPoisoned: "enemy is poisoned",
  conditionEnemyMaimed: "enemy is maimed",
  conditionEnemyBlinded: "enemy is blinded",
  conditionEnemyCursed: "enemy is cursed",
  conditionEnemyIntimidated: "enemy is intimidated",
  conditionEnemyCoveredInAsh: "enemy is covered in ash",
  conditionEnemyRareOrUnique: "enemy is rare or unique",
  conditionCritRecently: "you have crit recently",
  conditionKilledRecently: "you have killed recently",
  conditionMoving: "you are moving",
  conditionStationary: "you are stationary",
  conditionBeenHitRecently: "you have been hit recently",
  conditionLeeching: "you are leeching",
  conditionOnConsecratedGround: "you are on consecrated ground",
  conditionFullLife: "you are on full life",
  conditionLowLife: "you are on low life",
  conditionUsingFlask: "a flask is active",
};

/** Inputs that mean "this is being calculated against a boss". */
const BOSS_KEYS = [
  "enemyIsBoss",
  "conditionEnemyBoss",
  "enemyIsBossType",
  "bossSkillEffect",
];

function readInputs(doc: Document): Map<string, string> {
  const out = new Map<string, string>();
  for (const el of Array.from(doc.getElementsByTagName("Input"))) {
    const name = el.getAttribute("name");
    if (!name) continue;
    // PoB writes exactly one of these three attributes per input.
    const value =
      el.getAttribute("boolean") ??
      el.getAttribute("number") ??
      el.getAttribute("string");
    if (value !== null) out.set(name, value);
  }
  return out;
}

/**
 * Read the config the export was saved with. Best-effort: an export with no
 * <Input> elements yields a config reporting zero inputs, which the UI
 * renders as "no configuration was saved" rather than as "default".
 */
export function readPobConfig(doc: Document): PobConfig {
  const inputs = readInputs(doc);

  const conditionals: string[] = [];
  for (const [key, label] of Object.entries(CONDITIONAL_LABELS)) {
    if (inputs.get(key) === "true") conditionals.push(label);
  }

  const bossKey = BOSS_KEYS.find((k) => {
    const v = inputs.get(k);
    return v !== undefined && v !== "false" && v !== "NONE" && v !== "";
  });

  // PoB's buff mode: UNBUFFED / COMBAT / EFFECTIVE. EFFECTIVE assumes every
  // buff and charge is up, which is the most optimistic of the three.
  const buffModeRaw = inputs.get("misc_buffMode");
  const buffMode =
    buffModeRaw === "EFFECTIVE"
      ? "effective"
      : buffModeRaw === "COMBAT"
        ? "combat"
        : buffModeRaw === "UNBUFFED"
          ? "unbuffed"
          : null;

  return {
    inputCount: inputs.size,
    versusBoss: Boolean(bossKey),
    buffMode,
    conditionals: conditionals.sort(),
  };
}

/**
 * One sentence describing what the DPS figure actually represents, for use
 * anywhere a DPS number is shown or judged.
 */
export function describePobConfig(config: PobConfig | undefined): string {
  if (!config || config.inputCount === 0) {
    return "This export saved no Path of Building configuration, so the damage figures use PoB's defaults.";
  }

  const parts: string[] = [];
  parts.push(
    config.versusBoss
      ? "calculated against a boss"
      : "calculated against a normal enemy, not a boss"
  );
  if (config.buffMode === "effective") {
    parts.push("with all buffs and charges assumed active");
  } else if (config.buffMode === "unbuffed") {
    parts.push("with buffs excluded");
  }
  if (config.conditionals.length > 0) {
    parts.push(
      `assuming ${config.conditionals.length} condition${config.conditionals.length === 1 ? "" : "s"} hold (${config.conditionals.join(", ")})`
    );
  }
  return `These figures were ${parts.join(", ")}.`;
}
