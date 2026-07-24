import type { ImportedCharacter } from "@/lib/characterImport/types";
import { ResistanceBars } from "./ResistanceBars";
import { SectionTitle } from "@/components/shared/SectionTitle";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export function DefenseStatsPanel({
  character,
}: {
  character: ImportedCharacter;
}) {
  const { stats, pob } = character;
  const blockChance = stats.blockChance || pob?.blockChance || 0;

  return (
    <div className="space-y-4">
      <SectionTitle>Defenses</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Life" value={stats.life.toLocaleString()} />
        <Stat label="Energy Shield" value={stats.energyShield.toLocaleString()} />
        <Stat label="Evasion" value={stats.evasionRating.toLocaleString()} />
        <Stat label="Armour" value={stats.armour.toLocaleString()} />
        <Stat
          label={character.ehpIsEstimate ? "EHP (estimate)" : "EHP"}
          value={character.ehp.toLocaleString()}
        />
        {stats.ward > 0 && <Stat label="Ward" value={stats.ward.toLocaleString()} />}
        {stats.evadeChance > 0 && (
          <Stat label="Evade chance" value={`${Math.round(stats.evadeChance)}%`} />
        )}
        {blockChance > 0 && (
          <Stat label="Block chance" value={`${Math.round(blockChance)}%`} />
        )}
        {pob && pob.physicalDamageReduction > 0 && (
          <Stat
            label="Phys. reduction"
            value={`${Math.round(pob.physicalDamageReduction)}%`}
          />
        )}
        {pob && pob.spellSuppression > 0 && (
          <Stat
            label="Spell suppression"
            value={`${Math.round(pob.spellSuppression)}%`}
          />
        )}
      </div>
      <ResistanceBars stats={stats} pob={pob} />
    </div>
  );
}
