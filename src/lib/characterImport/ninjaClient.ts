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

// The whole operation (events SSE, optionally retried via proxy, then the
// model fetch, optionally retried via proxy) shares this one deadline —
// not a fresh timeout per hop — so a fully-blocked network can't stack up
// to 4x the budget before the UI gives up. 20s was chosen as "clearly
// broken" rather than "slow but working" for two round trips.
const TOTAL_FETCH_BUDGET_MS = 20_000;

// Fallback used only when a direct cross-origin fetch to poe.ninja fails
// before a status code is even visible — the dominant signature of a CORS
// block (no confirmed Access-Control-Allow-Origin header from poe.ninja for
// browser requests). The profile/events endpoints return the same public,
// unauthenticated data already visible on the character's public poe.ninja
// page, so there's nothing sensitive passing through the proxy. Behavior
// against the real poe.ninja endpoints is unverified in this dev environment
// (no outbound network path to test against) — if api.allorigins.win itself
// is ever unreliable, the paste-JSON fallback in ImportPanel still covers
// the gap.
const CORS_PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

async function fetchDirectOrProxied(
  url: string,
  init: RequestInit,
  signal: AbortSignal
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    if (signal.aborted) {
      throw new NinjaFetchError("network", `Timed out reaching ${url}`);
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new NinjaFetchError("network", `Request aborted for ${url}`);
    }
    try {
      return await fetch(`${CORS_PROXY_PREFIX}${encodeURIComponent(url)}`, {
        ...init,
        signal,
      });
    } catch {
      if (signal.aborted) {
        throw new NinjaFetchError(
          "network",
          `Timed out reaching ${url} (via CORS proxy)`
        );
      }
      throw new NinjaFetchError(
        "cors-likely",
        `Could not reach ${url} directly or via CORS proxy`
      );
    }
  }
}

async function readSseVersion(
  url: string,
  signal: AbortSignal
): Promise<number | null> {
  const response = await fetchDirectOrProxied(
    url,
    { headers: { Accept: "text/event-stream" } },
    signal
  );
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
  const signal = AbortSignal.timeout(TOTAL_FETCH_BUDGET_MS);

  const eventsUrl = `${NINJA_BASE}/poe2/api/events/character/${encodeURIComponent(
    account
  )}/${encodeURIComponent(leagueSlug)}/${encodeURIComponent(character)}`;
  const version = await readSseVersion(eventsUrl, signal);
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

  const response = await fetchDirectOrProxied(modelUrl, {}, signal);
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
