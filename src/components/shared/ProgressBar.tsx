export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
