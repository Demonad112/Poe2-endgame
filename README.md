# PoE2 Endgame Companion

> This is an unofficial, fan-made project and is not affiliated with,
> endorsed by, or sponsored by Grinding Gear Games. Path of Exile and
> Path of Exile 2 are trademarks of Grinding Gear Games. All game content,
> mechanic names, and terminology referenced here belong to their
> respective owners; this repo only contains original code and
> community-sourced strategy notes.

A second-monitor companion app for Path of Exile 2's 0.5 "Return of the
Ancients" endgame, built from a community Atlas Tree/Mechanics guide and a
0.5.4b endgame strategy guide:

- **Checklist** (`/checklist`) — step-by-step progression roadmap from
  campaign end through the full 301-point Atlas tree, with benchmark gates
  and common-mistake warnings.
- **Atlas Tree Planner** (`/atlas`) — an ordered/grouped flow of the named
  Atlas clusters, the top-of-tree memory forks, and per-mechanic sub-tree
  priority lists. There's no real node-graph data in the source guides, so
  this tracks *allocation sequence*, not the in-game tree's pixel layout.
- **Dashboard** (`/dashboard`) — ranked farming strategies, a quick
  strategy-picker quiz, pinnacle boss requirements, and current meta builds.
- **Character Import** (`/character`) — paste a poe.ninja profile URL to see
  your character's defenses, resistances, skills, gear, and a build
  assessment. Real DPS, per-damage-type max-hit-survivable, and crit stats
  are decoded from the Path of Building export poe.ninja embeds in the
  character model, so they're PoB's own numbers rather than ours.

Data lives in hand-edited files under `src/data/` — update those when a new
patch changes the numbers. Records that are unverified or conflict across
sources are flagged with a `SourceRef` and rendered as a badge in the UI.

All progress state (checklist completion, Atlas allocation, quiz answers,
pinned strategy, imported character) is stored client-side in
`localStorage`.

## The poe.ninja proxy

The app itself is a static site, but character import can't talk to
poe.ninja directly from a browser: poe.ninja blocks cross-origin requests,
and the first hop of its character API is a Server-Sent Events stream that
public CORS proxies buffer and choke on. Both problems only exist in the
browser, so `vercel-proxy/` holds a small serverless function that performs
the same two-step SSE → model fetch server-side and returns the JSON with
permissive CORS headers. It forwards only public profile data, requires no
credentials, and stores nothing.

Its base URL is overridable at build time with
`NEXT_PUBLIC_NINJA_PROXY_BASE` (no trailing slash). If the proxy is
unreachable, the UI falls back to letting you paste the character JSON by
hand, so the feature degrades rather than breaking.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building

```bash
npm run build
```

This produces a fully static export in `out/` (`output: 'export'` in
`next.config.ts`) — the app has no Node server or API routes of its own,
since it's deployed to GitHub Pages. The one piece of server-side code in
this repo is the standalone poe.ninja proxy under `vercel-proxy/`, which is
deployed separately to Vercel and is not part of the static build.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the
static export and publishes it via GitHub Pages.

**One-time manual step:** in the repo's Settings → Pages, set "Build and
deployment source" to **GitHub Actions** (this can't be done from the
workflow file itself).

## Privacy

There is no analytics or tracking of any kind, and your progress
(checklist completion, Atlas allocation, quiz answers, and any imported
character) is stored only in your own browser's `localStorage`.

Browsing the checklist, Atlas planner, and dashboard makes no network calls
at all. The one exception is **Character Import**: submitting a profile URL
sends the account, league, and character name from that URL to the
poe.ninja proxy described above, which fetches your public poe.ninja
profile and returns it. That request carries no progress data and no
credentials, and nothing is stored server-side — but it is a network call
that leaves your device, so it is called out here rather than glossed over.
If you would rather not make it, the paste-JSON option imports a character
entirely client-side.

## License

MIT — see [LICENSE](./LICENSE).
