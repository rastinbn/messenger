import type { PublicUser, User, UserStatus } from "@messenger/shared-types";

import { CURRENT_USER_ID, FIXTURE_USERS, toPublicUser } from "@/lib/fixtures/users";
import type { UserService } from "@/lib/services/types";

import { delay } from "./util";

// In-memory mutable copy so profile edits persist for the session.
const users = FIXTURE_USERS.map((u) => ({ ...u }));

export class MockUserService implements UserService {
  async getCurrentUser(): Promise<User> {
    await delay(150);
    return { ...users.find((u) => u.id === CURRENT_USER_ID)! };
  }

  async updateProfile(
    patch: Partial<Pick<User, "displayName" | "avatarUrl" | "statusMessage">>
  ): Promise<User> {
    await delay();
    const idx = users.findIndex((u) => u.id === CURRENT_USER_ID);
    users[idx] = { ...users[idx], ...patch };
    return { ...users[idx] };
  }

  async updateStatus(status: UserStatus): Promise<User> {
    await delay(150);
    const idx = users.findIndex((u) => u.id === CURRENT_USER_ID);
    users[idx] = { ...users[idx], status };
    return { ...users[idx] };
  }

  async searchUsers(query: string): Promise<PublicUser[]> {
    await delay(250);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter(
        (u) =>
          u.id !== CURRENT_USER_ID &&
          (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      )
      .map(toPublicUser);
  }

  async getUser(userId: string): Promise<PublicUser | null> {
    await delay(150);
    const found = users.find((u) => u.id === userId);
    return found ? toPublicUser(found) : null;
  }
}
