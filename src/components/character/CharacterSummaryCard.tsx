import type { ImportedCharacter } from "@/lib/characterImport/types";
import type { BuildAssessment } from "@/lib/characterImport/buildScore";
import { formatCompact } from "@/lib/characterImport/format";
import { StatusChip, type Tone } from "./Instruments";

const TIER_TONE: Record<BuildAssessment["tier"], Tone> = {
  A: "good",
  B: "accent",
  C: "caution",
  D: "critical",
};

function Inline({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] tracking-wider text-slate-500 uppercase">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Sticky identity bar.
 *
 * Fully expanded this page runs to roughly twelve screens on a phone, which
 * scrolls the character being analysed off-screen entirely. Keeping the name
 * and the two numbers that gate every other judgement pinned costs one row and
 * removes any doubt about whose gear is on screen.
 *
 * Offset below the nav (itself sticky) so the two never overlap.
 */
export function CharacterSummaryCard({
  character,
  assessment,
  pool,
  onClear,
}: {
  character: ImportedCharacter;
  assessment: BuildAssessment;
  pool: number;
  onClear: () => void;
}) {
  const dps = character.pob?.combinedDps ?? 0;

  return (
    <div className="sticky top-[3.25rem] z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]/95 px-4 py-2.5 shadow-[var(--lift)] backdrop-blur-md">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-slate-100">
          {character.name}
        </h3>
        <p className="truncate text-xs text-slate-500">
          Level {character.level}{" "}
          {character.ascendancy ?? character.characterClass} · {character.league}
        </p>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusChip tone={TIER_TONE[assessment.tier]}>
          Tier {assessment.tier}
        </StatusChip>
        {dps > 0 && (
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] tracking-wider text-slate-500 uppercase">
              DPS
            </span>
            <span className="text-sm font-semibold text-[var(--accent)] tabular-nums">
              {formatCompact(dps)}
            </span>
          </div>
        )}
        <Inline label="Pool" value={pool.toLocaleString()} />
        <Inline label="EHP" value={character.ehp.toLocaleString()} />
        <button
          onClick={onClear}
          className="shrink-0 rounded-md border border-[var(--hairline)] px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-white/25 hover:text-slate-200"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
