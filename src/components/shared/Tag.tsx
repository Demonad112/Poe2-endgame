import { MECHANIC_COLORS, MECHANIC_LABELS } from "@/lib/constants";
import type { Mechanic } from "@/lib/types";

export function Tag({ mechanic }: { mechanic: Mechanic | string }) {
  const colorClass =
    MECHANIC_COLORS[mechanic] ??
    "bg-slate-500/20 text-slate-300 border-slate-500/40";
  const label = MECHANIC_LABELS[mechanic] ?? mechanic;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
