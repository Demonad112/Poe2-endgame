import type { ImportedCharacter } from "@/lib/characterImport/types";

export function CharacterSummaryCard({
  character,
}: {
  character: ImportedCharacter;
}) {
  return (
    <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold text-slate-100">
          {character.name}
        </h3>
        <span className="text-sm text-slate-400">
          Level {character.level} {character.ascendancy ?? character.characterClass}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {character.account} · {character.league}
      </p>
    </div>
  );
}
