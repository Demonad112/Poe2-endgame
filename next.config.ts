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
  ...(isGithubActionsBuild
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
};

export default nextConfig;
