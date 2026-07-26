// Mirrors the basePath logic in next.config.ts. next/image does not
// automatically prefix a local public/ asset's `src` with basePath, so any
// image or fetch reference needs this applied explicitly to resolve correctly
// once deployed to GitHub Pages (which serves the site under /Poe2-endgame/).
//
// This reads NEXT_PUBLIC_BASE_PATH rather than GITHUB_ACTIONS directly:
// Next only inlines process.env into server code unless the variable is
// NEXT_PUBLIC_-prefixed, so a client component reading GITHUB_ACTIONS gets
// undefined and silently builds a root-relative URL that 404s in production.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
