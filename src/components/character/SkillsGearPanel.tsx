import type {
  GearItem,
  ImportedCharacter,
  ModCategory,
} from "@/lib/characterImport/types";
import { RESIST_LABEL, type ResistanceType } from "@/lib/characterImport/resistanceTiers";
import { SectionTitle } from "@/components/shared/SectionTitle";

const RARITY_COLOR: Record<string, string> = {
  Unique: "text-amber-600",
  Rare: "text-yellow-300",
  Magic: "text-indigo-300",
  Normal: "text-slate-200",
};

const CATEGORY_STYLE: Record<ModCategory, string> = {
  implicit: "text-slate-500",
  enchant: "text-cyan-300/80",
  rune: "text-cyan-300/80",
  explicit: "text-slate-400",
  crafted: "text-sky-300/80",
  desecrated: "text-fuchsia-300/80",
};

const CATEGORY_TAG: Partial<Record<ModCategory, string>> = {
  implicit: "implicit",
  enchant: "enchant",
  rune: "rune",
  crafted: "crafted",
  desecrated: "desecrated",
};

/**
 * The readable mod strings and the structured tier data are separate arrays
 * in poe.ninja's payload, so match them by resistance type — reliable here
 * because an item never carries two mods of the same resistance.
 *
 * Implicits are deliberately excluded: their tier numbers come from the base
 * item, not the suffix pool, so labelling a Ruby Ring's +22% implicit "T1"
 * would read as the 6-10% suffix tier and badly understate it.
 */
function tierForModLine(
  item: GearItem,
  mod: { category: ModCategory; text: string }
): string | null {
  if (mod.category === "implicit") return null;
  const match = (Object.keys(RESIST_LABEL) as ResistanceType[]).find((type) =>
    new RegExp(`${RESIST_LABEL[type]} Resistance`, "i").test(mod.text)
  );
  if (!match) return null;
  const grant = item.resistances.find(
    (r) => r.type === match && r.tier !== null && r.category !== "implicit"
  );
  return grant?.tier != null ? `T${grant.tier}` : null;
}

function GearCard({ item }: { item: GearItem }) {
  return (
    <li className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">
      <p className="flex items-baseline justify-between gap-2 font-medium">
        <span className={`truncate ${RARITY_COLOR[item.rarity] ?? "text-slate-100"}`}>
          {item.name}
        </span>
        <span className="shrink-0 text-xs text-slate-500">{item.slot}</span>
      </p>
      <p className="text-xs text-slate-400">
        {item.base}
        {item.itemLevel > 0 && (
          <span className="text-slate-600"> · ilvl {item.itemLevel}</span>
        )}
      </p>
      {item.mods.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-white/[0.06] pt-2">
          {item.mods.map((mod, i) => {
            const tier = tierForModLine(item, mod);
            return (
              <li
                key={i}
                className={`flex items-baseline gap-1.5 text-xs ${CATEGORY_STYLE[mod.category]}`}
              >
                {tier && (
                  <span className="shrink-0 rounded border border-[var(--accent)]/30 px-1 text-[10px] font-medium text-[var(--accent)]">
                    {tier}
                  </span>
                )}
                <span>{mod.text}</span>
                {CATEGORY_TAG[mod.category] && (
                  <span className="shrink-0 text-[10px] text-slate-600">
                    ({CATEGORY_TAG[mod.category]})
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

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
              <GearCard key={i} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
