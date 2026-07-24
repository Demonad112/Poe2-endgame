import type { PobStats } from "./types";

// poe.ninja embeds a Path of Building export (`charModel.pathOfBuildingExport`)
// in every character model. It's base64url-encoded, zlib-compressed PoB2 XML —
// and crucially it carries PoB's OWN computed <PlayerStat> values, including
// real DPS. Decoding it gives us numbers we have no calculator for, using only
// browser-native APIs (atob + DecompressionStream + DOMParser), no deps.
//
// Everything here is best-effort: any failure returns null and the UI simply
// omits the PoB-derived sections rather than breaking the import.

function base64UrlToBytes(input: string): Uint8Array {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // atob wants canonical padding; poe.ninja's blobs often omit it.
  const remainder = b64.length % 4;
  if (remainder === 2) b64 += "==";
  else if (remainder === 3) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function inflate(bytes: Uint8Array): Promise<string> {
  // PoB blobs start with a zlib header (0x78 0x9c -> "eNr" in base64), so
  // "deflate" (zlib-wrapped) is the right format, not "deflate-raw".
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  return new Response(stream).text();
}

function statMap(doc: Document): Map<string, number> {
  const out = new Map<string, number>();
  for (const el of Array.from(doc.getElementsByTagName("PlayerStat"))) {
    const key = el.getAttribute("stat");
    const raw = el.getAttribute("value");
    if (!key || raw === null) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) out.set(key, value);
  }
  return out;
}

/**
 * The DPS figures describe one specific socket group, so surface which skill
 * they belong to — a headline DPS number is meaningless without it.
 * `Build@mainSocketGroup` is a 1-based index into the active SkillSet's groups.
 */
function findMainSkill(doc: Document): string | undefined {
  const build = doc.getElementsByTagName("Build")[0];
  const skills = doc.getElementsByTagName("Skills")[0];
  if (!build || !skills) return undefined;

  const activeSetId = skills.getAttribute("activeSkillSet");
  const sets = Array.from(doc.getElementsByTagName("SkillSet"));
  const set =
    sets.find((s) => s.getAttribute("id") === activeSetId) ?? sets[0] ?? skills;

  const groups = Array.from(set.children).filter((c) => c.tagName === "Skill");
  const index = Number(build.getAttribute("mainSocketGroup") ?? "1");
  const group = groups[index - 1] ?? groups[0];
  if (!group) return undefined;

  // Within a group the first <Gem> is the active skill; the rest are supports.
  const gem = group.getElementsByTagName("Gem")[0];
  return gem?.getAttribute("nameSpec") ?? undefined;
}

export async function decodePobStats(
  pobExport: string | undefined
): Promise<PobStats | null> {
  if (!pobExport || typeof window === "undefined") return null;
  if (typeof DecompressionStream === "undefined") return null;

  try {
    const xml = await inflate(base64UrlToBytes(pobExport));
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) return null;

    const s = statMap(doc);
    if (s.size === 0) return null;
    const g = (key: string) => s.get(key) ?? 0;

    return {
      mainSkill: findMainSkill(doc),
      combinedDps: g("CombinedDPS"),
      totalDps: g("TotalDPS"),
      dotDps: g("TotalDotDPS"),
      averageDamage: g("AverageDamage"),
      speed: g("Speed"),
      critChance: g("CritChance"),
      critMultiplier: g("CritMultiplier"),
      hitChance: g("HitChance"),
      accuracy: g("MainHandAccuracy"),
      totalEhp: g("TotalEHP"),
      maxHitTaken: {
        physical: g("PhysicalMaximumHitTaken"),
        fire: g("FireMaximumHitTaken"),
        cold: g("ColdMaximumHitTaken"),
        lightning: g("LightningMaximumHitTaken"),
        chaos: g("ChaosMaximumHitTaken"),
      },
      resistOverCap: {
        fire: g("FireResistOverCap"),
        cold: g("ColdResistOverCap"),
        lightning: g("LightningResistOverCap"),
        chaos: g("ChaosResistOverCap"),
      },
      physicalDamageReduction: g("PhysicalDamageReduction"),
      spellSuppression: g("EffectiveSpellSuppressionChance"),
      blockChance: g("EffectiveBlockChance"),
    };
  } catch {
    return null;
  }
}
