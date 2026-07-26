import type { ResistanceStatus } from "@/lib/characterImport/resistanceAdvice";
import { isHealthy, ONE_SHOT_RATIO } from "@/lib/characterImport/thresholds";

/**
 * The small readouts that ride on a collapsed accordion row.
 *
 * Each one shows the single measurement its section is about, so the page can
 * be triaged shut. They are intentionally tiny and non-interactive — the row
 * itself is the control.
 */

export type Tone = "critical" | "caution" | "good" | "muted" | "accent";

const TONE_TEXT: Record<Tone, string> = {
  critical: "text-[var(--critical)]",
  caution: "text-[var(--caution)]",
  good: "text-[var(--good)]",
  muted: "text-slate-400",
  accent: "text-[var(--accent)]",
};

const TONE_BG: Record<Tone, string> = {
  critical: "bg-[var(--critical)]",
  caution: "bg-[var(--caution)]",
  good: "bg-[var(--good)]",
  muted: "bg-[var(--hairline)]",
  accent: "bg-[var(--accent)]",
};

/** Uppercase status chip. Border-only, so it never competes with a filled bar. */
export function StatusChip({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`shrink-0 rounded border border-current px-1.5 py-px text-[10px] font-bold tracking-wider uppercase ${TONE_TEXT[tone]}`}
    >
      {children}
    </span>
  );
}

/** A single headline number, e.g. combined DPS. */
export function NumberReadout({
  value,
  tone = "muted",
}: {
  value: string;
  tone?: Tone;
}) {
  return (
    <span
      className={`text-base font-semibold tracking-tight tabular-nums ${TONE_TEXT[tone]}`}
    >
      {value}
    </span>
  );
}

/** Four resistance pips — the fastest possible read of "am I capped?". */
export function ResistancePips({ statuses }: { statuses: ResistanceStatus[] }) {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {statuses.map((s) => {
        const tone: Tone = isHealthy(s.type, s.current)
          ? "good"
          : s.type === "chaos"
            ? "caution"
            : "critical";
        return (
          <span
            key={s.type}
            className={`h-[5px] w-4 rounded-[2px] ${TONE_BG[tone]}`}
          />
        );
      })}
    </span>
  );
}

/**
 * Miniature max-hit bar: the weakest damage type against the danger zone.
 * Same encoding as the full panel, so the collapsed and open views agree.
 */
export function DangerBar({
  weakest,
  best,
}: {
  weakest: number;
  best: number;
}) {
  const pct = best > 0 ? Math.min(100, (weakest / best) * 100) : 0;
  const atRisk = best > 0 && weakest < best * ONE_SHOT_RATIO;
  return (
    <span
      className="relative block h-[7px] w-[88px] overflow-hidden rounded-[3px] border border-[var(--hairline-soft)] bg-[var(--surface-well)]"
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 border-r border-dashed border-[var(--critical)]/80 bg-[var(--critical)]/15"
        style={{ width: `${ONE_SHOT_RATIO * 100}%` }}
      />
      <span
        className={`absolute inset-y-0 left-0 rounded-[2px] ${atRisk ? "bg-[var(--critical)]" : "bg-slate-500"}`}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}
