"use client";

import { Check, Minus } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAdminUsers,
  useDeleteUser,
  useSetUserRole,
  useSuspendUser,
  useUnsuspendUser
} from "@/hooks/useAdmin";
import { useCurrentUser } from "@/hooks/useUsers";
import { formatRelativeDay } from "@/lib/formatTime";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const { data, isLoading } = useAdminUsers(page, PAGE_SIZE, query || undefined);
  const { data: me } = useCurrentUser();

  const suspend = useSuspendUser();
  const unsuspend = useUnsuspendUser();
  const setRole = useSetUserRole();
  const deleteUser = useDeleteUser();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Input
        placeholder="Search by name, username, or email"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        className="mb-4 max-w-sm"
      />

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {data && (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.users.map((user) => {
                const isSelf = user.id === me?.id;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.displayName} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate">{user.displayName}</p>
                          <p className="text-xs text-text-muted truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.siteRole === "admin" ? "signal" : "neutral"}>
                        {user.siteRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.emailVerifiedAt ? (
                        <Check className="h-4 w-4 text-success" strokeWidth={2} aria-label="Verified" />
                      ) : (
                        <Minus className="h-4 w-4 text-text-muted" strokeWidth={2} aria-label="Not verified" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                      {formatRelativeDay(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {user.suspendedAt ? (
                        <Badge variant="danger">Suspended</Badge>
                      ) : (
                        <Badge variant="neutral">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {user.suspendedAt ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            isLoading={unsuspend.isPending}
                            onClick={() => unsuspend.mutate(user.id)}
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSelf}
                            isLoading={suspend.isPending}
                            onClick={() => suspend.mutate(user.id)}
                          >
                            Suspend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelf}
                          isLoading={setRole.isPending}
                          onClick={() =>
                            setRole.mutate({
                              id: user.id,
                              role: user.siteRole === "admin" ? "user" : "admin"
                            })
                          }
                        >
                          {user.siteRole === "admin" ? "Revoke admin" : "Make admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isSelf}
                          isLoading={deleteUser.isPending}
                          onClick={() => {
                            if (confirm(`Permanently delete ${user.displayName}? This can't be undone.`)) {
                              deleteUser.mutate(user.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
