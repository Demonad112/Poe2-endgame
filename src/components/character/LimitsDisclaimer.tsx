export function LimitsDisclaimer() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
      <h3 className="mb-2 font-semibold text-slate-300">
        What this doesn&apos;t do (yet)
      </h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          DPS isn&apos;t computed — it depends on exact skill/weapon rolls
          that need a dedicated calculator pass.
        </li>
        <li>
          The EHP figure above is a rough life+ES+ward-vs-resistance
          estimate, not a full layered armour/evasion/block model.
        </li>
        <li>
          Passive tree allocation is shown as a point count only —
          node-by-node visualization is a planned follow-up.
        </li>
        <li>No ladder comparison — this reads your character in isolation.</li>
      </ul>
    </div>
  );
}
