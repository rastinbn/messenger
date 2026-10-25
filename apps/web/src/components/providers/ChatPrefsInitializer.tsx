"use client";

import { useEffect } from "react";

import { useChatBackgroundStore } from "@/stores/useChatBackgroundStore";
import { useChatPrefsStore } from "@/stores/useChatPrefsStore";

/** Applies the persisted chat preferences (and per-chat backgrounds) on first client render. */
export function ChatPrefsInitializer() {
  const hydratePrefs = useChatPrefsStore((s) => s.hydrate);
  const hydrateBackgrounds = useChatBackgroundStore((s) => s.hydrate);

  useEffect(() => {
    hydratePrefs();
    hydrateBackgrounds();
  }, [hydratePrefs, hydrateBackgrounds]);

  return null;
}
