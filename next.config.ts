import type { NextConfig } from "next";

// GitHub Pages serves this project at https://<user>.github.io/Poe2-endgame/,
// not at the domain root, so production builds need a basePath/assetPrefix.
// Local dev must NOT set these or every route/asset link breaks.
const repoName = "Poe2-endgame";
const isGithubActionsBuild = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Re-export the base path under a NEXT_PUBLIC_ name so client components
  // can read it too. Next only inlines process.env into *server* code unless
  // the variable is NEXT_PUBLIC_-prefixed, so a client-side
  // process.env.GITHUB_ACTIONS check silently evaluates to undefined and any
  // asset URL built from it 404s in production while working locally.
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubActionsBuild ? `/${repoName}` : "",
  },
  ...(isGithubActionsBuild
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
};

export default nextConfig;
