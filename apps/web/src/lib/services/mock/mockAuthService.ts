import type { AuthSession, LoginInput, RegisterInput } from "@messenger/shared-types";

import { CURRENT_USER_ID, FIXTURE_USERS } from "@/lib/fixtures/users";
import type { AuthService } from "@/lib/services/types";

import { delay, uuid } from "./util";

const SESSION_KEY = "messenger.mock.session";

function buildSession(): AuthSession {
  const user = FIXTURE_USERS.find((u) => u.id === CURRENT_USER_ID)!;
  return {
    user,
    accessToken: `mock-access-${uuid()}`,
    refreshToken: `mock-refresh-${uuid()}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString()
  };
}

export class MockAuthService implements AuthService {
  async login(_input: LoginInput): Promise<AuthSession> {
    await delay();
    void _input;
    const session = buildSession();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }

  async register(_input: RegisterInput): Promise<AuthSession> {
    await delay();
    void _input;
    const session = buildSession();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }

  async logout(): Promise<void> {
    await delay(150);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    await delay(100);
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  }

  async resendVerificationEmail(): Promise<void> {
    await delay(200);
    // eslint-disable-next-line no-console
    console.log("[mock] Verification email would be resent here.");
  }

  async confirmEmailVerification(_token: string): Promise<void> {
    await delay(200);
    void _token;
  }

  async requestMagicLink(_email: string): Promise<void> {
    await delay(300);
    void _email;
    // eslint-disable-next-line no-console
    console.log("[mock] Magic link email would be sent here.");
  }

  async consumeMagicLink(_token: string): Promise<AuthSession> {
    await delay(300);
    void _token;
    const session = buildSession();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }
}
