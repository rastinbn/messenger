"use client";

import { useEffect } from "react";

import { CallOverlay } from "@/components/call/CallOverlay";
import { IncomingCallBanner } from "@/components/call/IncomingCallBanner";
import { initCallListeners } from "@/lib/call/callEngine";

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
    </>
  );
}
