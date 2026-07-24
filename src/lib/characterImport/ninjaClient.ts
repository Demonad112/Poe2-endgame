// Client-side port of poe2-mcp's profile-API fetch flow (character_fetcher.py
// / poe_ninja_api.py): read a version off an SSE stream, then fetch the
// character model JSON at that version. Nothing in poe2-mcp has ever called
// these endpoints from a browser (always Python httpx server-side), so CORS
// behavior here is genuinely unverified — every failure path is surfaced as
// a typed error so the UI can fall back to a paste-JSON flow instead of
// silently failing.

export type NinjaFetchErrorReason = "cors-likely" | "not-found" | "network";

export class NinjaFetchError extends Error {
  reason: NinjaFetchErrorReason;

  constructor(reason: NinjaFetchErrorReason, message: string) {
    super(message);
    this.name = "NinjaFetchError";
    this.reason = reason;
  }
}

const NINJA_BASE = "https://poe.ninja";
const FETCH_TIMEOUT_MS = 15_000;

// fetch() never times out on its own — a stalled connection (not just a
// CORS rejection, which fails fast) would otherwise leave the UI stuck on
// "Fetching…" indefinitely. Every request below is bounded by this.
function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

async function readSseVersion(url: string): Promise<number | null> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "text/event-stream" },
      signal: timeoutSignal(),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new NinjaFetchError("network", `Timed out reaching ${url}`);
    }
    // A cross-origin fetch that never reaches the server (CORS preflight
    // rejection, DNS failure, offline) throws a generic TypeError in
    // browsers — there's no way to distinguish "blocked by CORS" from other
    // network failures from script, so this is the dominant real-world
    // cause for a third-party API with no confirmed ACAO header.
    throw new NinjaFetchError("cors-likely", `Could not reach ${url}`);
  }
  if (response.status === 404) {
    throw new NinjaFetchError("not-found", `Not found: ${url}`);
  }
  if (!response.ok || !response.body) {
    throw new NinjaFetchError(
      "network",
      `Unexpected response (${response.status}) from ${url}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (possibly incomplete) line in the buffer for the next chunk.
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const parsed = JSON.parse(line.slice(5).trim());
            if (typeof parsed?.version === "number") return parsed.version;
          } catch {
            // malformed SSE payload — keep reading
          }
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return null;
}

/**
 * Fetch the raw `{type, charModel}` blob for a character via poe.ninja's
 * public (no-auth) profile API. Throws NinjaFetchError on any failure.
 */
export async function fetchCharModel(
  account: string,
  leagueSlug: string,
  character: string
): Promise<unknown> {
  const eventsUrl = `${NINJA_BASE}/poe2/api/events/character/${encodeURIComponent(
    account
  )}/${encodeURIComponent(leagueSlug)}/${encodeURIComponent(character)}`;
  const version = await readSseVersion(eventsUrl);
  if (version === null) {
    throw new NinjaFetchError(
      "not-found",
      "poe.ninja did not report a character version — check that the profile is public."
    );
  }

  const modelUrl = `${NINJA_BASE}/poe2/api/profile/characters/${encodeURIComponent(
    account
  )}/${encodeURIComponent(leagueSlug)}/${encodeURIComponent(
    character
  )}/model/${version}`;

  let response: Response;
  try {
    response = await fetch(modelUrl, { signal: timeoutSignal() });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new NinjaFetchError("network", `Timed out reaching ${modelUrl}`);
    }
    throw new NinjaFetchError("cors-likely", `Could not reach ${modelUrl}`);
  }
  if (response.status === 404) {
    throw new NinjaFetchError("not-found", `Not found: ${modelUrl}`);
  }
  if (!response.ok) {
    throw new NinjaFetchError(
      "network",
      `Unexpected response (${response.status}) from ${modelUrl}`
    );
  }
  return response.json();
}
