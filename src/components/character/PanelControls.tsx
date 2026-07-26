"use client";

/**
 * Expand-all / collapse-all for the accordion group.
 *
 * Writes `open` directly on the <details> elements rather than lifting their
 * state into React. Native <details> owns its own open state — mirroring it
 * would mean two sources of truth that desync the moment a user clicks a
 * summary directly. This is a side effect on a user action, not derived
 * state, so reaching for the DOM is the correct tool here rather than a
 * workaround.
 */
export function PanelControls({ targetId }: { targetId: string }) {
  const setAll = (open: boolean) => {
    const root = document.getElementById(targetId);
    if (!root) return;
    for (const el of Array.from(root.querySelectorAll("details"))) {
      el.open = open;
    }
  };

  const cls =
    "rounded border border-[var(--hairline)] bg-[var(--surface-well)] px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-white/25 hover:text-slate-200";

  return (
    <span className="ml-auto flex gap-1.5">
      <button type="button" onClick={() => setAll(true)} className={cls}>
        Expand all
      </button>
      <button type="button" onClick={() => setAll(false)} className={cls}>
        Collapse all
      </button>
    </span>
  );
}
