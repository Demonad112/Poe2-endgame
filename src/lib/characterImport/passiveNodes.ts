import { BASE_PATH } from "@/lib/basePath";

/** A named passive node: notable, keystone, or ascendancy. */
export interface PassiveNode {
  /** Name. */
  n: string;
  /** Kind: (n)otable, (k)eystone, (a)scendancy. */
  k: "n" | "k" | "a";
  /** Stat lines. */
  s: string[];
}

export type PassiveNodeTable = Record<string, PassiveNode>;

// 1,015 named nodes (968 notables, 30 keystones, 17 ascendancy) extracted from
// poe2-mcp's data/psg_passive_nodes.json. ~126KB, so it's fetched on demand
// alongside the affix table rather than bundled.
//
// Small passive nodes are deliberately excluded: they are the bulk of the
// 4,975-node dataset and carry no information a player acts on. An allocated
// id that doesn't resolve here is a small node, which is why the UI reports
// named nodes as a subset of the total rather than claiming full coverage.
const ASSET_URL = `${BASE_PATH}/data/passiveNodes.v1.json`;

let cache: PassiveNodeTable | null = null;
let inflight: Promise<PassiveNodeTable | null> | null = null;

export function getCachedPassiveNodes(): PassiveNodeTable | null {
  return cache;
}

export async function loadPassiveNodes(): Promise<PassiveNodeTable | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(ASSET_URL, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) return null;
      cache = (await res.json()) as PassiveNodeTable;
      return cache;
    } catch {
      // An enhancement — failing to load it must not break the import.
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export interface ResolvedPassives {
  keystones: PassiveNode[];
  notables: PassiveNode[];
  ascendancy: PassiveNode[];
  /** Allocated ids that resolved to a named node. */
  namedCount: number;
  /** Total allocated ids, named or not. */
  totalCount: number;
}

export function resolvePassives(
  allocatedNodes: number[] | undefined,
  table: PassiveNodeTable | null
): ResolvedPassives | null {
  if (!table || !allocatedNodes || allocatedNodes.length === 0) return null;

  const keystones: PassiveNode[] = [];
  const notables: PassiveNode[] = [];
  const ascendancy: PassiveNode[] = [];

  for (const id of allocatedNodes) {
    const node = table[String(id)];
    if (!node) continue;
    if (node.k === "k") keystones.push(node);
    else if (node.k === "a") ascendancy.push(node);
    else notables.push(node);
  }

  const byName = (a: PassiveNode, b: PassiveNode) => a.n.localeCompare(b.n);
  keystones.sort(byName);
  notables.sort(byName);
  ascendancy.sort(byName);

  return {
    keystones,
    notables,
    ascendancy,
    namedCount: keystones.length + notables.length + ascendancy.length,
    totalCount: allocatedNodes.length,
  };
}
