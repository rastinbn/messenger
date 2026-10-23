"use client";

import { useEffect } from "react";

import { useChatPrefsStore } from "@/stores/useChatPrefsStore";

/** Applies the persisted chat preferences on first client render. */
export function ChatPrefsInitializer() {
  const hydrate = useChatPrefsStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
