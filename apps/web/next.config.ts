import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, Next infers the workspace root from the nearest lockfile —
  // and there is an unrelated C:\Users\amb\package-lock.json above this repo, so
  // Turbopack rooted itself at the user's home directory. Watching/compiling
  // across that huge tree is what produced the stale module graph ("export
  // ... was not found", "useDeleteMessage is not a function") in dev.
  turbopack: {
    root: path.join(__dirname, "..", "..")
  }
};

export default nextConfig;
