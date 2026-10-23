"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

/**
 * Signatures of "this tab is running modules from a different build than the
 * server" — e.g. after a `next dev` restart, a redeploy, or a half-applied Fast
 * Refresh. The Turbopack identifier is precise for dev; the rest are the
 * production equivalents.
 */
const STALE_BUNDLE_PATTERN =
  /__TURBOPACK__imported__module__|Export [^"]* (?:doesn't exist|was not found)|ChunkLoadError|Failed to fetch dynamically imported module|Cannot find module/i;

const RELOAD_GUARD_KEY = "messenger.staleBundleReloaded";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);

    // A stale bundle is fixed by loading the current one, not by "try again".
    // Reload once per session so a real bug can't become a reload loop.
    if (!STALE_BUNDLE_PATTERN.test(error.message)) return;
    try {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
    } catch {
      // Storage can be unavailable (private mode); reloading once is still safe.
    }
    window.location.reload();
  }, [error]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-3">
      <TriangleAlert className="h-11 w-11 text-status-away" strokeWidth={1.5} aria-hidden />
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="text-text-secondary text-sm max-w-sm">
        An unexpected error occurred. You can try again, or head back to the home screen.
      </p>
      <Button className="mt-2" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
