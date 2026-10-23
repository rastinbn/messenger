/**
 * Persists the access/refresh token pair across page reloads. localStorage
 * (not sessionStorage) so a session survives closing the tab — refresh
 * tokens are long-lived by design (docs/api.md).
 *
 * This is plain browser storage, not an artifact sandbox — localStorage is
 * fully supported here since this is a real Next.js app, not a Claude.ai
 * artifact.
 */
const ACCESS_TOKEN_KEY = "messenger.accessToken";
const REFRESH_TOKEN_KEY = "messenger.refreshToken";
const EXPIRES_AT_KEY = "messenger.expiresAt";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export const tokenStorage = {
  save(tokens: StoredTokens): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(EXPIRES_AT_KEY, tokens.expiresAt);
  },

  load(): StoredTokens | null {
    if (typeof window === "undefined") return null;
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!accessToken || !refreshToken || !expiresAt) return null;
    return { accessToken, refreshToken, expiresAt };
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }
};
