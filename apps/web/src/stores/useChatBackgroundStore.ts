import { create } from "zustand";

export type ChatBackground =
  | "default"
  | "dots"
  | "grid"
  | "waves"
  | "sunset"
  | "ocean"
  | "forest"
  | "dusk";

export interface ChatBackgroundOption {
  id: ChatBackground;
  label: string;
}

export const CHAT_BACKGROUNDS: ChatBackgroundOption[] = [
  { id: "default", label: "Theme default" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "waves", label: "Waves" },
  { id: "sunset", label: "Sunset" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "dusk", label: "Dusk" }
];

const STORAGE_KEY = "messenger.chatBackgrounds";
const BACKGROUND_IDS = new Set<string>(CHAT_BACKGROUNDS.map((option) => option.id));

interface ChatBackgroundState {
  /** conversationId → background. Conversations without an entry use "default". */
  byConversation: Record<string, ChatBackground>;
  setBackground: (conversationId: string, background: ChatBackground) => void;
  reset: (conversationId: string) => void;
  hydrate: () => void;
}

function persist(byConversation: Record<string, ChatBackground>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ byConversation }));
  } catch {
    // Private mode / quota — the choice still applies for this session.
  }
}

export const useChatBackgroundStore = create<ChatBackgroundState>((set, get) => ({
  byConversation: {},

  setBackground: (conversationId, background) => {
    const next = { ...get().byConversation };
    if (background === "default") delete next[conversationId];
    else next[conversationId] = background;
    set({ byConversation: next });
    persist(next);
  },

  reset: (conversationId) => {
    const next = { ...get().byConversation };
    delete next[conversationId];
    set({ byConversation: next });
    persist(next);
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      const stored = (parsed as { byConversation?: Record<string, unknown> })?.byConversation;
      if (!stored || typeof stored !== "object") return;

      const byConversation: Record<string, ChatBackground> = {};
      for (const [conversationId, background] of Object.entries(stored)) {
        if (typeof background === "string" && BACKGROUND_IDS.has(background) && background !== "default") {
          byConversation[conversationId] = background as ChatBackground;
        }
      }
      set({ byConversation });
    } catch {
      // Corrupt entry — fall back to the theme default.
    }
  }
}));

/** Background for one conversation, with the store's default fallback. */
export function useChatBackground(conversationId: string): ChatBackground {
  return useChatBackgroundStore((s) => s.byConversation[conversationId] ?? "default");
}
