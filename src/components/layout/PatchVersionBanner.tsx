import { CURRENT_PATCH, LEAGUE_NAME } from "@/lib/constants";

export function PatchVersionBanner() {
  return (
    <div className="border-b border-white/[0.06] bg-gradient-to-r from-black/40 via-black/20 to-black/40 px-4 py-1.5 text-center text-xs text-slate-500">
      Data current as of patch{" "}
      <strong className="font-semibold text-slate-300">{CURRENT_PATCH}</strong>{" "}
      ({LEAGUE_NAME}) — community-derived, may drift from future patches. Items
      flagged{" "}
      <span className="font-medium text-amber-400">⚠ unverified/conflicting</span>{" "}
      should be double-checked in-game.
    </div>
  );
}
