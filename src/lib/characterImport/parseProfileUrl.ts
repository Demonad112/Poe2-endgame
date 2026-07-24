export interface ParsedProfileUrl {
  account: string;
  character: string;
  leagueSlug: string | null;
  league: string | null;
}

// poe.ninja URL shapes that identify a character, most-specific first — the
// 3-segment profile form is what poe.ninja actually links post-0.5 (league
// slug sits between account and /character/). Ported from poe2-mcp's
// parse_poe_ninja_url (src/api/poe_ninja_api.py). Positional (not named)
// capture groups — the project's TS target (ES2017) predates named-group
// type support — so each pattern lists its group order explicitly.
const URL_PATTERNS: { pattern: RegExp; groups: ("account" | "league" | "character")[] }[] = [
  {
    pattern: /poe\.ninja\/poe2\/profile\/([^/?#\s]+)\/([^/?#\s]+)\/character\/([^/?#\s]+)/,
    groups: ["account", "league", "character"],
  },
  {
    pattern: /poe\.ninja\/poe2\/profile\/([^/?#\s]+)\/character\/([^/?#\s]+)/,
    groups: ["account", "character"],
  },
  {
    pattern: /poe\.ninja\/poe2\/builds\/([^/?#\s]+)\/character\/([^/?#\s]+)\/([^/?#\s]+)/,
    groups: ["league", "account", "character"],
  },
  {
    pattern: /poe\.ninja\/poe2\/builds\/character\/([^/?#\s]+)\/([^/?#\s]+)/,
    groups: ["account", "character"],
  },
  {
    pattern: /poe\.ninja\/builds\/character\/([^/?#\s]+)\/([^/?#\s]+)/,
    groups: ["account", "character"],
  },
];

// League display name -> URL slug. The first key mapped to a given slug is
// its canonical display name, so leagueSlugToDisplay below returns e.g.
// "Runes of Aldur" rather than "RoA" for slug "runesofaldur".
const LEAGUE_MAPPINGS: Record<string, string> = {
  "Runes of Aldur": "runesofaldur",
  RoA: "runesofaldur",
  "Runes of Aldur Hardcore": "runesofaldurhc",
  "Runes of Aldur HC": "runesofaldurhc",
  "Runes of Aldur SSF": "runesofaldurssf",
  "Runes of Aldur HC SSF": "runesofaldurhcssf",
  "Runes of Aldur Hardcore SSF": "runesofaldurhcssf",
  "Fate of the Vaal": "vaal",
  FotV: "vaal",
  Vaal: "vaal",
  "Vaal Hardcore": "vaalhc",
  "Vaal HC": "vaalhc",
  "Vaal SSF": "vaalssf",
  "Vaal HC SSF": "vaalhcssf",
  "Vaal Hardcore SSF": "vaalhcssf",
  "Rise of the Abyssal": "abyss",
  Abyss: "abyss",
  "Abyss Hardcore": "abysshc",
  "Abyss HC": "abysshc",
  "Abyss SSF": "abyssssf",
  "Abyss HC SSF": "abysshcssf",
  "Abyss Hardcore SSF": "abysshcssf",
  "Dawn of the Hunt": "dawn",
  Dawn: "dawn",
  "Dawn Hardcore": "dawnhc",
  "Dawn HC": "dawnhc",
  "Dawn SSF": "dawnssf",
  "Dawn HC SSF": "dawnhcssf",
  Standard: "standard",
  Hardcore: "hardcore",
  "SSF Standard": "ssf-standard",
  "SSF Hardcore": "ssf-hardcore",
};

export function leagueSlugToDisplay(slug: string | null): string | null {
  if (!slug) return null;
  const lower = slug.toLowerCase();
  for (const [display, mapped] of Object.entries(LEAGUE_MAPPINGS)) {
    if (mapped === lower) return display;
  }
  return null;
}

export function leagueDisplayToSlug(league: string): string {
  if (league in LEAGUE_MAPPINGS) return LEAGUE_MAPPINGS[league];
  for (const [key, value] of Object.entries(LEAGUE_MAPPINGS)) {
    if (key.toLowerCase() === league.toLowerCase()) return value;
  }
  return league.toLowerCase().replace(/\s+/g, "-");
}

export function parseProfileUrl(url: string): ParsedProfileUrl | null {
  for (const { pattern, groups } of URL_PATTERNS) {
    const match = pattern.exec(url);
    if (!match) continue;
    const values: Partial<Record<"account" | "league" | "character", string>> = {};
    groups.forEach((name, i) => {
      values[name] = match[i + 1];
    });
    if (!values.account || !values.character) continue;
    const leagueSlug = values.league ?? null;
    return {
      account: decodeURIComponent(values.account),
      character: decodeURIComponent(values.character),
      leagueSlug,
      league: leagueSlugToDisplay(leagueSlug),
    };
  }
  return null;
}
