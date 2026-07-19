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

Data lives in hand-edited files under `src/data/` — update those when a new
patch changes the numbers. Records that are unverified or conflict across
sources are flagged with a `SourceRef` and rendered as a badge in the UI.

All state (checklist progress, Atlas allocation, quiz answers, pinned
strategy) is stored client-side in `localStorage` — there is no backend.

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
`next.config.ts`) — no Node server or API routes are used anywhere in the
app, since it's deployed to GitHub Pages.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the
static export and publishes it via GitHub Pages.

**One-time manual step:** in the repo's Settings → Pages, set "Build and
deployment source" to **GitHub Actions** (this can't be done from the
workflow file itself).

## Privacy

This app makes no network calls at runtime and has no backend, analytics,
or tracking of any kind. All progress (checklist completion, Atlas
allocation, quiz answers) is stored only in your own browser's
`localStorage` and never leaves your device.

## License

MIT — see [LICENSE](./LICENSE).
