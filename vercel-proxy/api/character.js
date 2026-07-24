// Minimal server-side proxy for poe.ninja's public PoE2 character API.
//
// Why this exists: the PoE2 Endgame Companion is a static GitHub Pages site,
// but poe.ninja's profile API can't be called from a browser — it blocks
// cross-origin requests (no Access-Control-Allow-Origin), and the first hop
// is a Server-Sent Events stream that public CORS proxies buffer and choke
// on. Running the same two-step fetch server-side sidesteps both problems
// (CORS doesn't apply server-to-server, and we read the SSE stream directly),
// then returns the raw {type, charModel} JSON with permissive CORS headers so
// the static site can consume it. No secrets — this is all public data.
//
// Deployed as a standalone Vercel project; the companion's client
// (src/lib/characterImport/ninjaClient.ts) calls it with account/league/
// character query params.

const NINJA_BASE = "https://poe.ninja";

async function readSseVersion(url) {
  const res = await fetch(url, { headers: { Accept: "text/event-stream" } });
  if (!res.ok || !res.body) return null;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const version = JSON.parse(line.slice(5).trim()).version;
            if (typeof version === "number") return version;
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const { account, league, character } = req.query;
  if (!account || !league || !character) {
    res
      .status(400)
      .json({ error: "account, league, and character query params are required" });
    return;
  }

  try {
    const eventsUrl = `${NINJA_BASE}/poe2/api/events/character/${encodeURIComponent(
      account
    )}/${encodeURIComponent(league)}/${encodeURIComponent(character)}`;
    const version = await readSseVersion(eventsUrl);
    if (version === null) {
      res.status(404).json({
        error:
          "poe.ninja did not report a character version — check the profile is public and the URL is correct.",
      });
      return;
    }

    const modelUrl = `${NINJA_BASE}/poe2/api/profile/characters/${encodeURIComponent(
      account
    )}/${encodeURIComponent(league)}/${encodeURIComponent(
      character
    )}/model/${version}`;
    const modelRes = await fetch(modelUrl);
    if (!modelRes.ok) {
      res
        .status(modelRes.status === 404 ? 404 : 502)
        .json({ error: `poe.ninja model endpoint returned ${modelRes.status}` });
      return;
    }
    const data = await modelRes.json();
    // Cache briefly at the edge — a character's snapshot doesn't change often,
    // and this softens repeat imports without going stale.
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: `Upstream fetch failed: ${String(err)}` });
  }
}
