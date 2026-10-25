"use client";

import type { Message, PublicUser } from "@messenger/shared-types";
import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatRelativeDay } from "@/lib/formatTime";
import { useChatPrefsStore } from "@/stores/useChatPrefsStore";
import type { ChatBackground } from "@/stores/useChatBackgroundStore";

export interface MessageListProps {
  messages: Message[];
  participants: PublicUser[];
  currentUserId: string;
  typingUserIds: string[];
  /** Switching threads lands on the newest message instantly instead of animating. */
  conversationId?: string;
  isLoading?: boolean;
  /** Per-conversation wallpaper, chosen from the chat header. */
  background?: ChatBackground;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

/** Distance from the bottom (px) that still counts as "following the thread". */
const NEAR_BOTTOM_PX = 48;

function dateKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function MessageList({
  messages,
  participants,
  currentUserId,
  typingUserIds,
  conversationId,
  isLoading,
  background = "default",
  onReply,
  onForward,
  onDelete
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const keepLastMessageVisible = useChatPrefsStore((s) => s.keepLastMessageVisible);

  const [isAtBottom, setIsAtBottom] = useState(true);
  // How many messages the reader had seen when they last sat at the bottom —
  // lets the chip distinguish "you're scrolled up" from "there's something new".
  const [seenCount, setSeenCount] = useState(0);

  // Mirrors of state that effects and the ResizeObserver read, so they can stay
  // mounted across renders without re-subscribing on every scroll event.
  const isAtBottomRef = useRef(true);
  const currentConversationRef = useRef(conversationId);
  const pendingInstantScrollRef = useRef(true);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setSeenCount(messages.length);
    },
    [messages.length]
  );

  // A thread switch should not animate a long scroll through somebody's history.
  useEffect(() => {
    if (currentConversationRef.current === conversationId) return;
    currentConversationRef.current = conversationId;
    pendingInstantScrollRef.current = true;
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, [conversationId]);

  // The core rule: with the preference on, always land on the newest message;
  // with it off, follow along only while the reader is already at the bottom and
  // otherwise surface the "jump to latest" affordance instead of yanking them.
  useEffect(() => {
    const behavior: ScrollBehavior = pendingInstantScrollRef.current ? "auto" : "smooth";
    pendingInstantScrollRef.current = false;

    if (keepLastMessageVisible || isAtBottomRef.current) {
      scrollToBottom(behavior);
    }
  }, [messages.length, typingUserIds.length, keepLastMessageVisible, scrollToBottom]);

  // Attachments resolving (images, file cards) grow the content *after* the effect
  // above has run, and a reply banner shrinks the scroll container — both reflow
  // the list after the fact, so keep the newest message pinned through them too.
  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (keepLastMessageVisible || isAtBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
    observer.observe(content);
    observer.observe(el);
    return () => observer.disconnect();
  }, [keepLastMessageVisible, isLoading]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setSeenCount(messages.length);
  }, [messages.length]);

  const hasUnseenMessages = !isAtBottom && messages.length > seenCount;

  const nameFor = (id: string) => participants.find((p) => p.id === id)?.displayName ?? "Unknown";

  if (isLoading) {
    return (
      <div
        className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-y-auto chat-surface"
        data-chat-bg={background === "default" ? undefined : background}
      >
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className={`h-10 ${i % 2 ? "w-1/3 ml-auto" : "w-1/2"}`} />
        ))}
      </div>
    );
  }

  // Defense-in-depth: dedupe by id in case an upstream cache update ever
  // slips a duplicate through (e.g. overlapping realtime + mutation writes).
  const uniqueMessages = messages.filter(
    (message, i) => messages.findIndex((m) => m.id === message.id) === i
  );

  if (uniqueMessages.length === 0) {
    // The wallpaper has to survive the empty state too — a brand-new chat
    // otherwise looks like the background choice did nothing.
    return (
      <div
        className="flex-1 min-h-0 flex items-center justify-center text-text-muted text-sm chat-surface"
        data-chat-bg={background === "default" ? undefined : background}
      >
        No messages yet — say hello.
      </div>
    );
  }

  // Pre-compute date-divider and sender-label flags in one pass so the
  // render map stays a pure function of `messages` (no mutation during render).
  const rows = uniqueMessages.map((message, i) => {
    const prev = uniqueMessages[i - 1];
    const showDateDivider = !prev || dateKey(prev.createdAt) !== dateKey(message.createdAt);
    const isOwn = message.senderId === currentUserId;
    const showSender = !isOwn && (!prev || prev.senderId !== message.senderId || showDateDivider);
    return { message, showDateDivider, isOwn, showSender };
  });

  return (
    <div
      className={cn("relative flex-1 min-h-0 chat-surface")}
      data-chat-bg={background === "default" ? undefined : background}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4"
        role="log"
        aria-label="Messages"
      >
        <div ref={contentRef} className="flex flex-col gap-3">
          {rows.map(({ message, showDateDivider, isOwn, showSender }) => (
            <div key={message.id} style={{ animation: "messageRise 160ms ease-out" }}>
              {showDateDivider && (
                <div className="flex items-center gap-3 my-2" role="separator">
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="text-[11px] text-text-muted font-mono">
                    {formatRelativeDay(message.createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              )}
              <ChatBubble
                message={message}
                isOwn={isOwn}
                senderName={nameFor(message.senderId)}
                showSender={showSender}
                onReply={onReply}
                onForward={onForward}
                onDelete={onDelete}
              />
            </div>
          ))}

          {typingUserIds.length > 0 && (
            <TypingIndicator
              label={
                typingUserIds.length === 1
                  ? `${nameFor(typingUserIds[0])} is typing`
                  : `${typingUserIds.length} people are typing`
              }
            />
          )}
        </div>
      </div>

      {!isAtBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border-default bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg hover:bg-bg-hover"
        >
          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {hasUnseenMessages ? "New message" : "Jump to latest"}
        </button>
      )}
    </div>
  );
}
