import type { ImportedCharacter } from "@/lib/characterImport/types";
import { SectionTitle } from "@/components/shared/SectionTitle";

export function SkillsGearPanel({
  character,
}: {
  character: ImportedCharacter;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <SectionTitle>Skill setups</SectionTitle>
        {character.skills.length === 0 ? (
          <p className="text-sm text-slate-500">
            No skill setups found in the imported data.
          </p>
        ) : (
          <ul className="space-y-2">
            {character.skills.map((setup, i) => (
              <li
                key={i}
                className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm"
              >
                <p className="font-medium text-slate-100">
                  {setup.main}{" "}
                  <span className="font-normal text-slate-500">
                    Lv{setup.level} Q{setup.quality}
                  </span>
                </p>
                {setup.supports.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    {setup.supports.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <SectionTitle>Gear</SectionTitle>
        {character.gear.length === 0 ? (
          <p className="text-sm text-slate-500">
            No gear found in the imported data.
          </p>
        ) : (
          <ul className="space-y-2">
            {character.gear.map((item, i) => (
              <li
                key={i}
                className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm"
              >
                <p className="flex items-baseline justify-between gap-2 font-medium text-slate-100">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">{item.slot}</span>
                </p>
                {item.base && <p className="text-xs text-slate-400">{item.base}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
