// Single source of truth for every "is this number good?" threshold on the
// character page.
//
// These used to be duplicated across buildScore.ts, resistanceAdvice.ts and
// ResistanceBars.tsx, and they had drifted: 18% chaos resistance rendered as
// a healthy green bar (>= 0), a warning in the assessment (< 30), and "12%
// short" in the resistance advice (target 30) — three verdicts on one screen
// for one number. Anything that judges a stat imports from here.

/** Elemental resistance cap. Overcap beyond this is map-mod insurance. */
export const RES_CAP = 75;

/**
 * Chaos resistance has no cap-driven breakpoint in PoE2 the way the elements
 * do, so this is a target rather than a cap: below it, chaos damage is worth
 * actively fixing. It is a judgement call, not a game constant — the UI says
 * so wherever it drives a verdict.
 */
export const CHAOS_TARGET = 30;

/** Below this, chaos resistance is actively dangerous rather than merely low. */
export const CHAOS_CRITICAL = 0;

/** Combined life + ES + ward pool bands. */
export const POOL_GOOD = 6000;
export const POOL_THIN = 4000;

/**
 * Rough endgame DPS bands. Heuristics, not published benchmarks — no
 * authoritative 0.5 community numbers were available when this was written.
 *
 * They are also NOT boss DPS: the figures they grade come from whatever
 * config the character's Path of Building export was saved with, which in
 * practice carries no boss setting at all (see pobConfig.ts). Anything that
 * renders a verdict from these has to say so.
 */
export const DPS_STRONG = 1_000_000;
export const DPS_OK = 300_000;
export const DPS_LOW = 100_000;

/**
 * A max-hit-taken value below this fraction of the character's best is a
 * one-shot risk worth flagging. Applied to EVERY damage type, not just the
 * single lowest — on a real test character physical (4,264) sat under the
 * threshold alongside chaos (3,808) and went unreported, which is the more
 * dangerous miss of the two since physical hits are far more common.
 */
export const ONE_SHOT_RATIO = 0.4;

export type ResistanceKey = "fire" | "cold" | "lightning" | "chaos";

/** Target for a resistance: the cap for elements, the target for chaos. */
export function targetFor(type: ResistanceKey): number {
  return type === "chaos" ? CHAOS_TARGET : RES_CAP;
}

/** Whether a resistance value clears its target. */
export function isHealthy(type: ResistanceKey, value: number): boolean {
  return value >= targetFor(type);
}
