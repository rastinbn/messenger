import { create } from "zustand";

export type Theme = "dark" | "light" | "midnight" | "forest" | "sunset" | "rose";

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
    description: "The default dark theme",
    swatches: ["#141417", "#26262e", "#5b8cff"]
  },
  {
    id: "light",
    label: "Paper",
    description: "Bright and neutral",
    swatches: ["#f7f7f9", "#ffffff", "#3a63dd"]
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep navy blue",
    swatches: ["#0b1020", "#1a2540", "#7aa2ff"]
  },
  {
    id: "forest",
    label: "Forest",
    description: "Quiet greens",
    swatches: ["#0c1511", "#1a2b22", "#4ade80"]
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Warm dusk tones",
    swatches: ["#17100f", "#2c1e1a", "#ff8a4c"]
  },
  {
    id: "rose",
    label: "Rose",
    description: "Plum with a pink accent",
    swatches: ["#150f14", "#2a1d2b", "#ff6b9d"]
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
