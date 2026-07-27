"use client";

import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";
import type { ImportedCharacter } from "@/lib/characterImport/types";
import type { CharacterSnapshot } from "@/lib/characterImport/snapshot";
import { appendSnapshot } from "@/lib/characterImport/snapshot";

export function useCharacterImport() {
  const { state, setState } = usePersistedState();

  const setPinnedImport = useCallback(
    (character: ImportedCharacter | undefined) => {
      setState((prev) => ({
        ...prev,
        character: { ...prev.character, pinnedImport: character },
      }));
    },
    [setState]
  );

  /**
   * Record a character's numbers for trending.
   *
   * The snapshot is built by the caller rather than derived here, because it
   * needs the keystone-corrected defensive pool — and keystones only resolve
   * once the passive node table has loaded, which happens after the import
   * itself completes.
   */
  const recordSnapshot = useCallback(
    (snapshot: CharacterSnapshot) => {
      setState((prev) => ({
        ...prev,
        character: {
          ...prev.character,
          history: appendSnapshot(prev.character.history ?? [], snapshot),
        },
      }));
    },
    [setState]
  );

  const clearPinnedImport = useCallback(
    () => setPinnedImport(undefined),
    [setPinnedImport]
  );

  /** Drops the trend for every character, not just the pinned one. */
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      character: { ...prev.character, history: [] },
    }));
  }, [setState]);

  return {
    pinnedImport: state.character.pinnedImport,
    history: state.character.history ?? [],
    setPinnedImport,
    recordSnapshot,
    clearPinnedImport,
    clearHistory,
  };
}
