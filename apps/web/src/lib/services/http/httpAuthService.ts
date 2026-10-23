import type { AuthSession, LoginInput, RegisterInput } from "@messenger/shared-types";

import { apiFetch } from "@/lib/api/http-client";
import { disconnectSocket, getSocket } from "@/lib/api/socket-client";
import { tokenStorage } from "@/lib/api/token-storage";
import type { AuthService } from "@/lib/services/types";

export class HttpAuthService implements AuthService {
  async login(input: LoginInput): Promise<AuthSession> {
    const session = await apiFetch<AuthSession>("/v1/auth/login", {
      method: "POST",
      body: input,
      skipAuth: true
    });
    tokenStorage.save(session);
    getSocket();
    return session;
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const session = await apiFetch<AuthSession>("/v1/auth/register", {
      method: "POST",
      body: input,
      skipAuth: true
    });
    tokenStorage.save(session);
    getSocket();
    return session;
  }

  async logout(): Promise<void> {
    const stored = tokenStorage.load();
    if (stored) {
      await apiFetch("/v1/auth/logout", {
        method: "POST",
        body: { refreshToken: stored.refreshToken }
      }).catch(() => {});
    }
    disconnectSocket();
    tokenStorage.clear();
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const stored = tokenStorage.load();
    if (!stored) return null;

    try {
      const user = await apiFetch<AuthSession["user"]>("/v1/users/me");
      const fresh = tokenStorage.load();
      if (!fresh) return null;
      getSocket();
      return { user, ...fresh };
    } catch {
      tokenStorage.clear();
      return null;
    }
  }

  async resendVerificationEmail(): Promise<void> {
    await apiFetch("/v1/auth/verify-email/resend", { method: "POST" });
  }

  async confirmEmailVerification(token: string): Promise<void> {
    await apiFetch("/v1/auth/verify-email/confirm", {
      method: "POST",
      body: { token },
      skipAuth: true
    });
  }

  async requestMagicLink(email: string): Promise<void> {
    await apiFetch("/v1/auth/magic-link/request", {
      method: "POST",
      body: { email },
      skipAuth: true
    });
  }

  async consumeMagicLink(token: string): Promise<AuthSession> {
    const session = await apiFetch<AuthSession>("/v1/auth/magic-link/consume", {
      method: "POST",
      body: { token },
      skipAuth: true
    });
    tokenStorage.save(session);
    getSocket();
    return session;
  }
}
