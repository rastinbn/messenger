import type { PublicUser, User, UserStatus } from "@messenger/shared-types";

import { apiFetch } from "@/lib/api/http-client";
import type { UserService } from "@/lib/services/types";

export class HttpUserService implements UserService {
  async getCurrentUser(): Promise<User> {
    return apiFetch<User>("/v1/users/me");
  }

  async updateProfile(
    patch: Partial<Pick<User, "displayName" | "avatarUrl" | "statusMessage">>
  ): Promise<User> {
    return apiFetch<User>("/v1/users/me", { method: "PATCH", body: patch });
  }

  async updateStatus(status: UserStatus): Promise<User> {
    return apiFetch<User>("/v1/users/me/status", { method: "PATCH", body: { status } });
  }

  async searchUsers(query: string): Promise<PublicUser[]> {
    if (!query.trim()) return [];
    return apiFetch<PublicUser[]>(`/v1/users/search?q=${encodeURIComponent(query)}`);
  }

  async getUser(userId: string): Promise<PublicUser | null> {
    try {
      return await apiFetch<PublicUser>(`/v1/users/${userId}`);
    } catch {
      return null;
    }
  }
}
