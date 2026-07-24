// Character fetch for the import feature.
//
// poe.ninja's public PoE2 profile API can't be called from a browser: it
// blocks cross-origin requests (no Access-Control-Allow-Origin), and the
// first hop is a Server-Sent Events stream that public CORS proxies buffer
// and choke on. So instead of hitting poe.ninja directly, we call a tiny
// server-side proxy (vercel-proxy/api/character.js in this repo, deployed to
// Vercel) that runs the same two-step SSE->model fetch server-side and
// returns the raw {type, charModel} JSON with permissive CORS headers. All
// public data — no auth, no secrets. If the proxy is unreachable, the UI
// falls back to the manual paste-JSON flow.

export type NinjaFetchErrorReason = "cors-likely" | "not-found" | "network";

export class NinjaFetchError extends Error {
  reason: NinjaFetchErrorReason;

  constructor(reason: NinjaFetchErrorReason, message: string) {
    super(message);
    this.name = "NinjaFetchError";
    this.reason = reason;
  }
}

// Overridable at build time via NEXT_PUBLIC_NINJA_PROXY_BASE (no trailing
// slash) so the proxy can be redeployed/moved without a code change.
const PROXY_BASE = (
  process.env.NEXT_PUBLIC_NINJA_PROXY_BASE ||
  "https://poe2-endgame-ninja-proxy.vercel.app"
).replace(/\/+$/, "");

const FETCH_TIMEOUT_MS = 20_000;

/**
 * Fetch the raw `{type, charModel}` blob for a character via the server-side
 * proxy (which talks to poe.ninja's public profile API). Throws
 * NinjaFetchError on any failure so the UI can offer the paste-JSON fallback.
 */
export async function fetchCharModel(
  account: string,
  leagueSlug: string,
  character: string
): Promise<unknown> {
  const url =
    `${PROXY_BASE}/api/character?account=${encodeURIComponent(account)}` +
    `&league=${encodeURIComponent(leagueSlug)}` +
    `&character=${encodeURIComponent(character)}`;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new NinjaFetchError("network", "The import service timed out.");
    }
    // A fetch that never returns a Response (network down, or the proxy's
    // CORS/protection blocked it before the body was readable) lands here.
    throw new NinjaFetchError(
      "cors-likely",
      "Couldn't reach the import service."
    );
  }

  if (response.status === 404) {
    // The proxy returns 404 both for an unknown character and for a
    // poe.ninja "no version" result — its JSON body carries the detail.
    let detail = "Character not found — check the profile is public and the URL is correct.";
    try {
      const body = await response.json();
      if (body?.error) detail = String(body.error);
    } catch {
      // non-JSON body — keep the default message
    }
    throw new NinjaFetchError("not-found", detail);
  }

  if (!response.ok) {
    throw new NinjaFetchError(
      "network",
      `Import service returned ${response.status}.`
    );
  }

  return response.json();
}
