import type { ReactNode } from "react";

/**
 * A collapsible section built on native <details>.
 *
 * Deliberately not a stateful React disclosure: <details> gives keyboard
 * support, correct semantics for assistive tech, browser find-in-page
 * expansion and fragment-navigation expansion for free, and it renders
 * correctly before hydration — which matters on a statically exported site
 * where the character page is otherwise entirely client-driven.
 */
export function Accordion({
  id,
  title,
  summary,
  badge,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
  /** One-line preview shown while collapsed, so the section is scannable. */
  summary?: ReactNode;
  /** Short status chip, e.g. a count or a warning marker. */
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-lg border border-white/10 bg-white/[0.02] open:bg-white/[0.03]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]/60 [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-90"
        >
          <path
            d="M7.5 5l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold text-slate-200">{title}</span>
            {badge}
          </span>
          {summary && (
            <span className="mt-0.5 block text-xs text-slate-500 group-open:hidden">
              {summary}
            </span>
          )}
        </span>
      </summary>
      <div className="border-t border-white/[0.06] px-4 py-4">{children}</div>
    </details>
  );
}
