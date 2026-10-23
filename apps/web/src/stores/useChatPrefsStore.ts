import { create } from "zustand";

/**
 * Chat read-position preferences.
 *
 * `keepLastMessageVisible` is the "always show the newest message" switch: when
 * on, the message list jumps to the bottom whenever a message arrives (or the
 * content grows, e.g. an image finishing loading) even if the user had scrolled
 * up. When off, it only follows along while the user is already near the bottom
 * and otherwise offers a "jump to latest" affordance instead of yanking the view.
 *
 * Persisted to localStorage by hand (same pattern as useThemeStore) so it
 * survives reloads without pulling in zustand/middleware.
 */
const STORAGE_KEY = "messenger.chatPrefs";

interface ChatPrefsState {
  keepLastMessageVisible: boolean;
  setKeepLastMessageVisible: (value: boolean) => void;
  hydrate: () => void;
}

export const useChatPrefsStore = create<ChatPrefsState>((set) => ({
  keepLastMessageVisible: true,

  setKeepLastMessageVisible: (keepLastMessageVisible) => {
    set({ keepLastMessageVisible });
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ keepLastMessageVisible }));
    } catch {
      // Private-mode / quota failures are non-fatal — the in-memory value stands.
    }
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "keepLastMessageVisible" in parsed &&
        typeof (parsed as { keepLastMessageVisible?: unknown }).keepLastMessageVisible === "boolean"
      ) {
        set({ keepLastMessageVisible: (parsed as { keepLastMessageVisible: boolean }).keepLastMessageVisible });
      }
    } catch {
      // Corrupt entry — fall back to the default (on).
    }
  }
}));
