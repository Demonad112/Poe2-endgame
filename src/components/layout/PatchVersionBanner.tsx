import { CURRENT_PATCH, LEAGUE_NAME } from "@/lib/constants";

export function PatchVersionBanner() {
  return (
    <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-1.5 text-center text-xs text-slate-400">
      Data current as of patch <strong className="text-slate-300">{CURRENT_PATCH}</strong>{" "}
      ({LEAGUE_NAME}) — content is community-derived and may drift from
      future patches. Items flagged{" "}
      <span className="text-amber-400">⚠ unverified/conflicting</span> should
      be double-checked in-game.
    </div>
  );
}
