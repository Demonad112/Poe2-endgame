export function LimitsDisclaimer({
  ehpIsEstimate,
  hasPob,
}: {
  ehpIsEstimate: boolean;
  hasPob: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
      <h3 className="mb-2 font-semibold text-slate-300">
        Where these numbers come from
      </h3>
      <ul className="list-disc space-y-1 pl-5">
        {hasPob ? (
          <li>
            DPS, max-hit-taken and crit figures are read from the Path of
            Building export poe.ninja embeds — they&apos;re PoB&apos;s own
            calculations, for the main skill group only, under PoB&apos;s
            default config (no custom boss/buff settings applied).
          </li>
        ) : (
          <li>
            This character had no readable Path of Building export, so DPS,
            max-hit-taken and crit stats aren&apos;t available — only what
            poe.ninja reports directly.
          </li>
        )}
        {ehpIsEstimate ? (
          <li>
            poe.ninja didn&apos;t supply an EHP, so the figure shown is a rough
            life+ES+ward-vs-resistance estimate, not a layered model.
          </li>
        ) : (
          <li>EHP is poe.ninja&apos;s own figure, not recalculated here.</li>
        )}
        <li>
          The letter grade is a rough guide from thresholds we picked, not a
          published community benchmark — treat it as a prompt to look closer,
          not a verdict.
        </li>
        <li>
          Passive tree is a point count only — node-by-node visualization is a
          planned follow-up. No ladder comparison yet.
        </li>
      </ul>
    </div>
  );
}
