// Mirrors the basePath logic in next.config.ts. next/image does not
// automatically prefix a local public/ asset's `src` with basePath, so any
// image reference needs this applied explicitly to resolve correctly once
// deployed to GitHub Pages (which serves the site under /Poe2-endgame/).
export const BASE_PATH =
  process.env.GITHUB_ACTIONS === "true" ? "/Poe2-endgame" : "";
