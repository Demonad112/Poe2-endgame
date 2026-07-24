"use client";

import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";
import type { ImportedCharacter } from "@/lib/characterImport/types";

export function useCharacterImport() {
  const { state, setState } = usePersistedState();

  const setPinnedImport = useCallback(
    (character: ImportedCharacter | undefined) => {
      setState((prev) => ({
        ...prev,
        character: { pinnedImport: character },
      }));
    },
    [setState]
  );

  const clearPinnedImport = useCallback(
    () => setPinnedImport(undefined),
    [setPinnedImport]
  );

  return {
    pinnedImport: state.character.pinnedImport,
    setPinnedImport,
    clearPinnedImport,
  };
}
