"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminConversations, useDeleteConversation } from "@/hooks/useAdmin";
import { formatRelativeDay } from "@/lib/formatTime";

const PAGE_SIZE = 20;

export default function AdminConversationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminConversations(page, PAGE_SIZE);
  const deleteConversation = useDeleteConversation();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {data && (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Conversation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.conversations.map((conv) => (
                <tr key={conv.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-text-muted">{conv.id.slice(0, 8)}…</span>
                    {conv.name && <span className="ml-2">{conv.name}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{conv.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{conv.participantCount}</td>
                  <td className="px-4 py-3 text-text-secondary">{conv.messageCount}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                    {conv.lastMessageAt ? formatRelativeDay(conv.lastMessageAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={deleteConversation.isPending}
                      onClick={() => {
                        if (confirm("Permanently delete this conversation and all its messages?")) {
                          deleteConversation.mutate(conv.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
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
