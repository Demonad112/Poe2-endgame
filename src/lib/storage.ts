import type { PersistedState } from "./types";
import { CHARACTER_SCHEMA_VERSION } from "./characterImport/types";

export const STORAGE_KEY = "poe2-endgame-companion:v1";
export const STORAGE_VERSION = 1;

const DEFAULT_STATE: PersistedState = {
  version: STORAGE_VERSION,
  checklist: { completedStepIds: [], completedActionItemKeys: [] },
  atlas: { allocatedClusterIds: [], allocatedForkIds: [] },
  dashboard: { lastQuizAnswers: {}, pinnedStrategyId: undefined },
  character: { pinnedImport: undefined, history: [] },
  updatedAt: new Date(0).toISOString(),
};

export function defaultState(): PersistedState {
  return DEFAULT_STATE;
}

// Module-level cache + subscriber list backing useSyncExternalStore, so the
// localStorage read only ever happens once per client session (lazily, on
// first getSnapshot() call) instead of inside a render/effect body.
let cache: PersistedState = DEFAULT_STATE;
let cacheInitialized = false;
const listeners = new Set<() => void>();

/**
 * A pinned character is a snapshot of something that keeps changing as you
 * play, so it goes stale on its own. Drop it after this long rather than
 * presenting week-old gear as current.
 */
export const PINNED_IMPORT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// A pinned character written by an older build can also be missing fields the
// current UI reads, which previously threw during render and took the whole
// page down with it. Both checks discard only the character — checklist,
// Atlas and dashboard progress are untouched, so recovering never costs more
// than one re-import.
function sanitizeCharacter(
  character: PersistedState["character"] | undefined
): PersistedState["character"] {
  // History survives independently of the pinned character. A snapshot holds
  // only numbers, so a schema bump to ImportedCharacter — which discards the
  // pinned import — must not throw away a trend that is still readable.
  const history = Array.isArray(character?.history)
    ? character.history.filter(
        (s): s is NonNullable<typeof s> =>
          !!s && typeof s.key === "string" && typeof s.at === "string"
      )
    : [];

  const pinned = character?.pinnedImport;
  if (!pinned) return { pinnedImport: undefined, history };

  const shapeOk =
    pinned.schemaVersion === CHARACTER_SCHEMA_VERSION &&
    Array.isArray(pinned.gear) &&
    Array.isArray(pinned.skills) &&
    pinned.gear.every(
      (item) => Array.isArray(item?.mods) && Array.isArray(item?.resistances)
    );
  if (!shapeOk) return { pinnedImport: undefined, history };

  const fetchedAt = Date.parse(pinned.provenance?.fetchedAt ?? "");
  const expired =
    Number.isFinite(fetchedAt) && Date.now() - fetchedAt > PINNED_IMPORT_MAX_AGE_MS;

  return { pinnedImport: expired ? undefined : pinned, history };
}

function readFromLocalStorage(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.version !== STORAGE_VERSION) return DEFAULT_STATE;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      character: sanitizeCharacter(parsed.character),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeToLocalStorage(state: PersistedState): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage can throw in private-browsing contexts — best-effort only.
  }
}

export function getSnapshot(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  if (!cacheInitialized) {
    cache = readFromLocalStorage();
    cacheInitialized = true;
  }
  return cache;
}

export function getServerSnapshot(): PersistedState {
  return DEFAULT_STATE;
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function setPersistedState(
  updater: (prev: PersistedState) => PersistedState
): void {
  const next = updater(getSnapshot());
  cache = next;
  cacheInitialized = true;
  writeToLocalStorage(next);
  listeners.forEach((listener) => listener());
}
