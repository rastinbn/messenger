import { apiFetch } from "./http-client";

/**
 * Admin API calls go straight through apiFetch rather than through the
 * Services abstraction layer (lib/services/types.ts). Deliberate exception:
 * the admin panel is inherently a Phase 2 (real backend) feature with no
 * meaningful mock equivalent — there's nothing useful to fake for "delete
 * any user's account" in a demo. Every other feature in this app respects
 * the mock/http boundary; this one small area doesn't need to.
 */

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status: string;
  siteRole: "user" | "admin";
  emailVerifiedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminConversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  participantCount: number;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface AdminConversationList {
  conversations: AdminConversation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalConversations: number;
  totalMessages: number;
  messagesToday: number;
  suspendedUsers: number;
}

export const adminApi = {
  getStats: () => apiFetch<AdminStats>("/v1/admin/stats"),

  listUsers: (page: number, pageSize: number, q?: string) =>
    apiFetch<AdminUserList>(
      `/v1/admin/users?page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),
  suspendUser: (id: string) => apiFetch(`/v1/admin/users/${id}/suspend`, { method: "PUT" }),
  unsuspendUser: (id: string) => apiFetch(`/v1/admin/users/${id}/unsuspend`, { method: "PUT" }),
  setUserRole: (id: string, role: "user" | "admin") =>
    apiFetch(`/v1/admin/users/${id}/role`, { method: "PUT", body: { role } }),
  deleteUser: (id: string) => apiFetch(`/v1/admin/users/${id}`, { method: "DELETE" }),

  listConversations: (page: number, pageSize: number) =>
    apiFetch<AdminConversationList>(`/v1/admin/conversations?page=${page}&pageSize=${pageSize}`),
  deleteConversation: (id: string) => apiFetch(`/v1/admin/conversations/${id}`, { method: "DELETE" })
};
