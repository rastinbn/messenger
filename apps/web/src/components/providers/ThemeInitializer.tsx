"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/stores/useThemeStore";

/** Applies the persisted theme to <html data-theme> on first client render. */
export function ThemeInitializer() {
  const hydrate = useThemeStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
