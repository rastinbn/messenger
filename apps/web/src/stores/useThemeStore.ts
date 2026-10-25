import { create } from "zustand";

export type Theme = "dark" | "neon" | "aurora" | "cyber" | "sunset" | "candy";

export interface ThemeOption {
  id: Theme;
  label: string;
  description: string;
  /** [base, elevated, accent] — used to render the picker swatch. */
  swatches: [string, string, string];
}

/**
 * Single source of truth for the theme picker. The palettes themselves live in
 * globals.css as `:root[data-theme="…"]` blocks; this list only drives the UI.
 */
export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "dark",
    label: "Graphite",
    description: "The calm default",
    swatches: ["#141417", "#26262e", "#5b8cff"]
  },
  {
    id: "neon",
    label: "Neon",
    description: "Cyan and magenta after dark",
    swatches: ["#07060f", "#171029", "#22d3ee"]
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Teal and violet, like a night sky",
    swatches: ["#04121a", "#0d2a33", "#2dd4bf"]
  },
  {
    id: "cyber",
    label: "Cyber",
    description: "Black and acid lime",
    swatches: ["#060a05", "#121c0d", "#a3e635"]
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Burnt orange and hot pink",
    swatches: ["#12060c", "#2b101c", "#fb923c"]
  },
  {
    id: "candy",
    label: "Candy",
    description: "A bright palette with a hot-pink accent",
    swatches: ["#fff1f8", "#ffe6f3", "#ec4899"]
  }
];

const STORAGE_KEY = "messenger.theme";
const THEME_IDS = new Set<string>(THEME_OPTIONS.map((option) => option.id));

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode / quota — the in-memory choice still applies this session.
    }
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const theme = stored && THEME_IDS.has(stored) ? (stored as Theme) : "dark";
    set({ theme });
    applyTheme(theme);
  }
}));
