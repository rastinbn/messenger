"use client";

import { CircleAlert, Info, X } from "lucide-react";
import { useEffect } from "react";

import { CallOverlay } from "@/components/call/CallOverlay";
import { IncomingCallBanner } from "@/components/call/IncomingCallBanner";
import { cn } from "@/lib/cn";
import { initCallListeners } from "@/lib/call/callEngine";
import { useCallStore } from "@/stores/useCallStore";

/**
 * Transient feedback that must be visible even when there is no call overlay
 * (e.g. "permission denied" while joining, "call declined" after it closed).
 */
function CallToast() {
  const notice = useCallStore((s) => s.notice);
  const error = useCallStore((s) => s.error);
  const setNotice = useCallStore((s) => s.setNotice);
  const setError = useCallStore((s) => s.setError);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  const message = error ?? notice;
  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-20 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-2.5 text-sm shadow-2xl",
        "border-border-default bg-bg-elevated text-text-primary"
      )}
    >
      {error ? (
        <CircleAlert className="h-4 w-4 shrink-0 text-danger" aria-hidden />
      ) : (
        <Info className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
      )}
      <span>{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => (error ? setError(null) : setNotice(null))}
        className="text-text-muted hover:text-text-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/**
 * The ONE place call signaling listeners get wired up (see
 * lib/call/callEngine.ts for why this must be singular). Mount exactly once
 * at the app-shell level. Components elsewhere (e.g. ChatWindowHeader) use
 * the useCall() hook to trigger actions — they don't set up their own
 * listeners.
 */
export function CallProvider() {
  useEffect(() => {
    const cleanup = initCallListeners();
    return cleanup;
  }, []);

  return (
    <>
      <IncomingCallBanner />
      <CallOverlay />
      <CallToast />
    </>
  );
}
