import type { AuthSession } from "@messenger/shared-types";

import { tokenStorage } from "./token-storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshInFlight: Promise<AuthSession> | null = null;

/**
 * Exchanges the stored refresh token for a new access/refresh pair. Dedupes
 * concurrent callers (if five requests 401 at once, only one refresh call
 * goes out) via `refreshInFlight`.
 */
async function refreshSession(): Promise<AuthSession> {
  if (refreshInFlight) return refreshInFlight;

  const stored = tokenStorage.load();
  if (!stored) throw new ApiError(401, "No refresh token available.");

  refreshInFlight = fetch(`${API_BASE_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: stored.refreshToken })
  })
    .then(async (res) => {
      if (!res.ok) {
        tokenStorage.clear();
        throw new ApiError(res.status, "Session expired. Please log in again.");
      }
      const session: AuthSession = await res.json();
      tokenStorage.save(session);
      return session;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
  skipAuth?: boolean;
}

/**
 * Central fetch wrapper: attaches the bearer token, retries once on 401
 * after a transparent token refresh, and normalizes errors to ApiError so
 * every service can catch one consistent type.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData, skipAuth } = options;

  async function attempt(): Promise<Response> {
    const headers: Record<string, string> = {};
    if (!isFormData) headers["Content-Type"] = "application/json";

    if (!skipAuth) {
      const stored = tokenStorage.load();
      if (stored) headers["Authorization"] = `Bearer ${stored.accessToken}`;
    }

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined
    });
  }

  let res = await attempt();

  if (res.status === 401 && !skipAuth) {
    try {
      await refreshSession();
      res = await attempt();
    } catch {
      tokenStorage.clear();
      throw new ApiError(401, "Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new ApiError(res.status, message ?? "Request failed.");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
