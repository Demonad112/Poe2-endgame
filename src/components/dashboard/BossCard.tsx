import type { PinnacleBoss } from "@/lib/types";
import { Tag } from "@/components/shared/Tag";
import { SourceFlag } from "@/components/shared/SourceFlag";

export function BossCard({ boss }: { boss: PinnacleBoss }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-100">{boss.name}</h3>
        {boss.mechanic && !["apex", "trial"].includes(boss.mechanic) && (
          <Tag mechanic={boss.mechanic} />
        )}
        <SourceFlag source={boss.source} />
      </div>

      {boss.hpFloor && (
        <p className="text-xs text-slate-500">HP floor: {boss.hpFloor}</p>
      )}

      {boss.fragmentCost.length > 0 && (
        <ul className="text-sm text-slate-300">
          {boss.fragmentCost.map((f) => (
            <li key={f.itemName}>
              {f.quantity}× {f.itemName}
            </li>
          ))}
        </ul>
      )}

      <ul className="list-disc pl-4 text-xs text-slate-400">
        {boss.gatingRequirements.map((req) => (
          <li key={req}>{req}</li>
        ))}
      </ul>

      {boss.notes && <p className="text-xs text-slate-500">{boss.notes}</p>}
    </div>
  );
}
