import { create } from "zustand";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "messenger.theme";

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(STORAGE_KEY, theme);
    }
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const theme = stored ?? "dark";
    set({ theme });
    document.documentElement.setAttribute("data-theme", theme);
  }
}));
