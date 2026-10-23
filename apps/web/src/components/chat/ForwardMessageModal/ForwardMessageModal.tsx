"use client";

import type { Conversation, Message, PublicUser } from "@messenger/shared-types";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

import { useConversations } from "@/hooks/useChat";

export interface ForwardMessageModalProps {
  message: Message | null;
  /** The thread the message currently lives in — excluded from the picker. */
  sourceConversationId: string;
  currentUserId: string;
  isForwarding?: boolean;
  onClose: () => void;
  onForward: (targetConversationId: string) => void;
}

function conversationTitle(conversation: Conversation, currentUserId: string): string {
  if (conversation.type === "group") return conversation.name ?? "Group";
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.displayName ?? "Unknown";
}

function conversationOther(conversation: Conversation, currentUserId: string): PublicUser | undefined {
  return conversation.type === "direct"
    ? conversation.participants.find((p) => p.id !== currentUserId)
    : undefined;
}

export function ForwardMessageModal({
  message,
  sourceConversationId,
  currentUserId,
  isForwarding,
  onClose,
  onForward
}: ForwardMessageModalProps) {
  const { data: conversations, isLoading } = useConversations();
  const [query, setQuery] = useState("");

  const targets = useMemo(() => {
    const list = (conversations ?? []).filter((c) => c.id !== sourceConversationId);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => conversationTitle(c, currentUserId).toLowerCase().includes(q));
  }, [conversations, query, sourceConversationId, currentUserId]);

  return (
    <Modal isOpen={!!message} onClose={onClose} title="Forward message" size="sm">
      {message && (
        <div className="mb-4 rounded-[var(--radius-sm)] border-l-2 border-accent-signal bg-bg-elevated px-2.5 py-1.5">
          <p className="truncate text-xs text-text-secondary">
            {message.content || "Attachment"}
          </p>
        </div>
      )}

      <Input
        placeholder="Search conversations"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search conversations to forward to"
      />

      <div className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
        {isLoading && <p className="py-6 text-center text-sm text-text-muted">Loading…</p>}

        {!isLoading && targets.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">
            No other conversations to forward into.
          </p>
        )}

        {targets.map((conversation) => {
          const title = conversationTitle(conversation, currentUserId);
          const other = conversationOther(conversation, currentUserId);
          return (
            <button
              key={conversation.id}
              type="button"
              disabled={isForwarding}
              onClick={() => onForward(conversation.id)}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-bg-hover disabled:opacity-50"
            >
              <Avatar name={title} src={conversation.avatarUrl} status={other?.status} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
              <span className="text-xs text-text-muted">{isForwarding ? "Sending…" : "Send"}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
