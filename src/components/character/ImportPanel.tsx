"use client";

import { useState, type FormEvent } from "react";
import { parseProfileUrl } from "@/lib/characterImport/parseProfileUrl";
import { fetchCharModel, NinjaFetchError } from "@/lib/characterImport/ninjaClient";
import {
  normalizeCharacter,
  extractPobExport,
  CharModelParseError,
} from "@/lib/characterImport/parseCharModel";
import { decodePobStats } from "@/lib/characterImport/pobStats";
import type { ImportedCharacter } from "@/lib/characterImport/types";

/**
 * Attach Path of Building-derived stats (real DPS, max hit taken, crit) when
 * the character model carries a decodable export. Best-effort: a failed or
 * absent export just yields the character unchanged.
 */
async function withPobStats(
  character: ImportedCharacter,
  raw: unknown
): Promise<ImportedCharacter> {
  const pob = await decodePobStats(extractPobExport(raw));
  return pob ? { ...character, pob } : character;
}

type Status = "idle" | "loading";

export function ImportPanel({
  onImported,
}: {
  onImported: (character: ImportedCharacter) => void;
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handleUrlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    const parsed = parseProfileUrl(trimmed);
    if (!parsed) {
      setError(
        "That doesn't look like a poe.ninja profile URL. Expected something like poe.ninja/poe2/profile/<account>/<league>/character/<name>."
      );
      setShowPaste(true);
      return;
    }
    if (!parsed.leagueSlug) {
      setError(
        "Couldn't determine the league from that URL — use the full profile URL (with the league segment), or paste the character JSON below."
      );
      setShowPaste(true);
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const raw = await fetchCharModel(
        parsed.account,
        parsed.leagueSlug,
        parsed.character
      );
      const character = normalizeCharacter(
        raw,
        {
          fetchedAt: new Date().toISOString(),
          sourceUrl: trimmed,
          importMethod: "live-fetch",
        },
        parsed.account,
        parsed.character
      );
      const enriched = await withPobStats(character, raw);
      setStatus("idle");
      onImported(enriched);
    } catch (err) {
      setStatus("idle");
      setShowPaste(true);
      if (err instanceof NinjaFetchError) {
        if (err.reason === "cors-likely") {
          setError(
            "Couldn't reach the import service. Paste the character JSON below instead — see the instructions there."
          );
        } else if (err.reason === "not-found") {
          setError(
            `${err.message} You can also paste the character JSON below.`
          );
        } else {
          setError(`Import failed: ${err.message} You can also paste the JSON below.`);
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Unknown error fetching character."
        );
      }
    }
  };

  const handlePasteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasteError(null);
    try {
      const raw: unknown = JSON.parse(pasteValue);
      const character = normalizeCharacter(raw, {
        fetchedAt: new Date().toISOString(),
        importMethod: "pasted-json",
      });
      onImported(await withPobStats(character, raw));
    } catch (err) {
      if (err instanceof CharModelParseError) {
        setPasteError(err.message);
      } else if (err instanceof SyntaxError) {
        setPasteError("That isn't valid JSON.");
      } else {
        setPasteError(err instanceof Error ? err.message : "Could not parse that JSON.");
      }
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://poe.ninja/poe2/profile/<account>/<league>/character/<name>"
          className="flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus-visible:border-[var(--accent)]/50"
        />
        <button
          type="submit"
          disabled={status === "loading" || !url.trim()}
          className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium whitespace-nowrap text-[var(--accent)] transition-colors hover:border-[var(--accent)]/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Fetching…" : "Import"}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowPaste((s) => !s)}
        className="text-xs text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-200"
      >
        {showPaste ? "Hide paste-JSON option" : "Or paste the character JSON instead"}
      </button>

      {showPaste && (
        <form onSubmit={handlePasteSubmit} className="space-y-2">
          <p className="text-xs text-slate-500">
            poe.ninja may block direct requests from a browser tab. As a
            workaround: open the profile URL above in a new tab, open your
            browser&apos;s DevTools → Network tab, reload, find the request
            to <code className="text-slate-400">.../model/&lt;version&gt;</code>,
            and paste its response body here.
          </p>
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            rows={6}
            placeholder='{"type": "...", "charModel": { ... }}'
            className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-[var(--accent)]/50"
          />
          {pasteError && (
            <p className="rounded-md border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-sm text-red-200">
              {pasteError}
            </p>
          )}
          <button
            type="submit"
            disabled={!pasteValue.trim()}
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Parse pasted JSON
          </button>
        </form>
      )}
    </div>
  );
}
