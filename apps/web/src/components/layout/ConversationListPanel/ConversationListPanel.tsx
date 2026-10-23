"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { ConversationRow } from "@/components/chat/ConversationRow";
import { NewGroupModal } from "@/components/chat/NewGroupModal";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useConversations } from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useUsers";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores/useUiStore";

export function ConversationListPanel() {
  const { data: conversations, isLoading } = useConversations();
  const { data: currentUser } = useCurrentUser();
  const params = useParams<{ conversationId?: string }>();
  const [query, setQuery] = useState("");
  const [isNewGroupOpen, setNewGroupOpen] = useState(false);
  const isMobileOpen = useUiStore((s) => s.isMobileConversationListOpen);

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.participants.some((p) => p.displayName.toLowerCase().includes(q))
    );
  }, [conversations, query]);

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 w-full md:w-80 shrink-0 border-r border-border-subtle bg-bg-base",
        "md:flex",
        isMobileOpen ? "flex" : "hidden"
      )}
    >
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-lg">Chats</h1>
          <button
            onClick={() => setNewGroupOpen(true)}
            aria-label="New group"
            className="h-8 w-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover text-lg"
          >
            +
          </button>
        </div>
        <Input
          placeholder="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {isLoading &&
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}

        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-sm text-text-muted mt-8">No conversations found.</p>
        )}

        {!isLoading &&
          currentUser &&
          filtered.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUser.id}
              isActive={params.conversationId === conversation.id}
            />
          ))}
      </div>

      <NewGroupModal isOpen={isNewGroupOpen} onClose={() => setNewGroupOpen(false)} />
    </div>
  );
}
