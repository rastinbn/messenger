"use client";

import type { Conversation } from "@messenger/shared-types";
import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { formatRelativeDay } from "@/lib/formatTime";

export interface ConversationRowProps {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
}

function displayName(conversation: Conversation, currentUserId: string): string {
  if (conversation.type === "group") return conversation.name ?? "Group";
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.displayName ?? "Unknown";
}

export function ConversationRow({ conversation, currentUserId, isActive }: ConversationRowProps) {
  const name = displayName(conversation, currentUserId);
  const other =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.id !== currentUserId)
      : undefined;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={cn(
        "relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-[var(--radius-md)] transition-colors group",
        isActive ? "bg-bg-elevated" : "hover:bg-bg-hover"
      )}
    >
      {/* Ink-stroke unread indicator — thickness/brightness signals unread state instead of a badge. */}
      <span
        className={cn(
          "absolute left-0 top-1.5 bottom-1.5 rounded-full transition-all",
          hasUnread ? "w-[3px] bg-accent-signal" : "w-[2px] bg-transparent"
        )}
        aria-hidden
      />

      <Avatar name={name} size="md" status={other?.status} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm truncate", hasUnread ? "font-semibold text-text-primary" : "text-text-primary")}>
            {name}
          </span>
          {conversation.lastMessageAt && (
            <span className="text-[11px] text-text-muted font-mono shrink-0">
              {formatRelativeDay(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className={cn(
              "text-xs truncate",
              hasUnread ? "text-text-secondary" : "text-text-muted"
            )}
          >
            {conversation.lastMessagePreview ?? "No messages yet"}
          </span>
          {hasUnread && (
            <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-accent-signal text-white text-[11px] font-semibold flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
