"use client";

import { useResetProgress } from "@/hooks/useResetProgress";

export function Footer() {
  const resetProgress = useResetProgress();

  const handleReset = () => {
    if (
      window.confirm(
        "Reset all saved progress? This clears your checklist, Atlas allocation, and dashboard selections in this browser. This can't be undone."
      )
    ) {
      resetProgress();
    }
  };

  return (
    <footer className="mt-auto border-t border-white/[0.06] px-4 py-6 text-xs text-slate-500 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          Unofficial fan project — not affiliated with or endorsed by Grinding
          Gear Games. MIT licensed.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Demonad112/Poe2-endgame"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300"
          >
            View source
          </a>
          <button
            onClick={handleReset}
            className="hover:text-red-400"
          >
            Reset all progress
          </button>
        </div>
      </div>
    </footer>
  );
}
