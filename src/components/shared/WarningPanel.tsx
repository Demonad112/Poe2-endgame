import type { CommonMistake, Stage } from "@/lib/types";
import { Tag } from "./Tag";

export function WarningPanel({
  mistakes,
  stage,
  title = "Common mistakes",
}: {
  mistakes: CommonMistake[];
  stage: Stage;
  title?: string;
}) {
  const relevant = mistakes.filter((m) => m.appliesToStage.includes(stage));
  if (relevant.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-500/25 bg-gradient-to-b from-red-500/[0.07] to-red-500/[0.03] p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-300">
        <span aria-hidden>⚠</span> {title}
      </h3>
      <ul className="space-y-3">
        {relevant.map((m) => (
          <li key={m.id} className="text-sm text-red-100/90">
            <p className="font-medium text-red-200">{m.title}</p>
            <p className="text-red-100/70">{m.description}</p>
            {m.relatedMechanics && m.relatedMechanics.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {m.relatedMechanics.map((mech) => (
                  <Tag key={mech} mechanic={mech} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
