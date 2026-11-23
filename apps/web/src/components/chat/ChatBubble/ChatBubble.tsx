"use client";

import type { Message, MessageReaction } from "@messenger/shared-types";
import {
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  Ellipsis,
  Forward,
  SmilePlus,
  type LucideIcon
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AudioCard } from "@/components/ui/AudioCard";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { EmojiPickerPlaceholder } from "@/components/ui/EmojiPicker";
import { FileCard } from "@/components/ui/FileCard";
import { ImageCard } from "@/components/ui/ImageCard";
import { cn } from "@/lib/cn";
import { formatMessageTime } from "@/lib/formatTime";
import { useUiStore } from "@/stores/useUiStore";

export interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
  currentUserId: string;
  showSender?: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  /** Sends `null` when the user taps their own reaction again (toggle off). */
  onReact?: (message: Message, emoji: string | null) => void;
  /** Jumps to the quoted message when the reply preview is clicked. */
  onJumpToMessage?: (messageId: string) => void;
}

const statusIcon: Record<Message["status"], LucideIcon> = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: CircleAlert
};

function ReactionChip({
  reaction,
  mine,
  onToggle
}: {
  reaction: MessageReaction;
  mine: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={mine}
      aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length} ${
        reaction.userIds.length === 1 ? "person" : "people"
      }${mine ? " (including you)" : ""}`}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-none transition-colors",
        mine
          ? "border-accent-signal bg-accent-signal/15 text-text-primary"
          : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-hover"
      )}
    >
      <span aria-hidden>{reaction.emoji}</span>
      <span className="font-mono text-[11px]">{reaction.userIds.length}</span>
    </button>
  );
}

export function ChatBubble({
  message,
  isOwn,
  senderName,
  currentUserId,
  showSender,
  onReply,
  onForward,
  onDelete,
  onReact,
  onJumpToMessage
}: ChatBubbleProps) {
  const openImageViewer = useUiStore((s) => s.openImageViewer);
  const openFilePreview = useUiStore((s) => s.openFilePreview);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isDeleted = !!message.deletedAt;
  const quoted = message.replyTo;
  const myReaction = message.reactions.find((r) => r.userIds.includes(currentUserId));

  useEffect(() => {
    if (!pickerOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  const toggleReaction = (emoji: string) => {
    if (isDeleted) return;
    setPickerOpen(false);
    onReact?.(message, myReaction?.emoji === emoji ? null : emoji);
  };

  // A tombstone has no content to act on — only its timestamp is meaningful.
  const items: DropdownItem[] = isDeleted
    ? []
    : [
        ...(message.content
          ? [{ label: "Copy text", onSelect: () => navigator.clipboard.writeText(message.content) }]
          : []),
        { label: "React", onSelect: () => setPickerOpen(true) },
        { label: "Reply", onSelect: () => onReply?.(message) },
        { label: "Forward", onSelect: () => onForward?.(message) },
        ...(isOwn ? [{ label: "Delete", onSelect: () => onDelete?.(message), danger: true }] : [])
      ];

  return (
    <ContextMenu items={items}>
      <div
        className={cn(
          "group relative flex flex-col gap-1 max-w-[75%]",
          isOwn ? "items-end ml-auto" : "items-start"
        )}
      >
        {showSender && !isOwn && <span className="text-xs text-text-muted px-1">{senderName}</span>}

        {message.forwarded && (
          <span className="flex items-center gap-1 px-1 text-[11px] italic text-text-muted">
            <Forward className="h-3 w-3" strokeWidth={2} aria-hidden /> Forwarded
          </span>
        )}

        {quoted && (
          <button
            type="button"
            onClick={() => onJumpToMessage?.(quoted.id)}
            title="Jump to original message"
            className={cn(
              "max-w-full rounded-[var(--radius-sm)] border-l-2 px-2.5 py-1.5 text-xs text-left",
              onJumpToMessage && "cursor-pointer hover:brightness-125",
              isOwn
                ? "border-white/50 bg-white/10 text-white/80"
                : "border-accent-signal bg-bg-base text-text-secondary"
            )}
          >
            <p className="font-medium truncate">{quoted.senderName}</p>
            <p className="truncate">
              {quoted.deletedAt ? "Message deleted" : quoted.content || "Attachment"}
            </p>
          </button>
        )}

        {message.attachments.map((att) => {
          // Voice messages are ordinary file attachments whose mime type is
          // audio/*; render them as a player instead of a file chip.
          if (att.mimeType.startsWith("audio/")) {
            return <AudioCard key={att.id} url={att.url} fileName={att.fileName} isOwn={isOwn} />;
          }

          return att.type === "image" ? (
            <ImageCard
              key={att.id}
              fileName={att.fileName}
              url={att.url}
              mimeType={att.mimeType}
              width={att.width}
              height={att.height}
              onOpen={() => openImageViewer({ url: att.url, fileName: att.fileName })}
            />
          ) : (
            <FileCard
              key={att.id}
              fileName={att.fileName}
              mimeType={att.mimeType}
              sizeBytes={att.sizeBytes}
              onOpen={() =>
                openFilePreview({
                  id: att.id,
                  fileName: att.fileName,
                  mimeType: att.mimeType,
                  sizeBytes: att.sizeBytes,
                  url: att.url
                })
              }
            />
          );
        })}

        {isDeleted ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default px-3.5 py-2 text-sm italic text-text-muted">
            This message was deleted
          </div>
        ) : (
          message.content && (
            <div
              className={cn(
                "rounded-[var(--radius-lg)] px-3.5 py-2 text-sm leading-relaxed break-words",
                isOwn
                  ? "bg-accent-signal text-white rounded-br-[var(--radius-sm)]"
                  : "bg-bg-elevated text-text-primary rounded-bl-[var(--radius-sm)]"
              )}
            >
              {message.content}
            </div>
          )
        )}

        {!isDeleted && message.reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 px-1", isOwn ? "justify-end" : "justify-start")}>
            {message.reactions.map((reaction) => (
              <ReactionChip
                key={reaction.emoji}
                reaction={reaction}
                mine={reaction.userIds.includes(currentUserId)}
                onToggle={() => toggleReaction(reaction.emoji)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 px-1">
          <span className="text-[11px] text-text-muted font-mono">
            {formatMessageTime(message.createdAt)}
            {message.editedAt && " · edited"}
          </span>
          {isOwn && !isDeleted && (() => {
            const StatusIcon = statusIcon[message.status];
            return (
              <StatusIcon
                className={cn(
                  "h-3.5 w-3.5",
                  message.status === "read" ? "text-accent-signal" : "text-text-muted",
                  message.status === "failed" && "text-danger"
                )}
                strokeWidth={2}
                aria-label={`Message ${message.status}`}
              />
            );
          })()}

          {!isDeleted && (
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((open) => !open)}
                aria-label="Add reaction"
                aria-expanded={pickerOpen}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-text-muted",
                  "hover:bg-bg-hover hover:text-text-primary",
                  "opacity-60 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                )}
              >
                <SmilePlus className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
              {pickerOpen && (
                <div
                  className={cn(
                    "absolute bottom-full z-30 mb-2",
                    isOwn ? "right-0" : "left-0"
                  )}
                >
                  <EmojiPickerPlaceholder
                    onSelect={toggleReaction}
                    onClose={() => setPickerOpen(false)}
                  />
                </div>
              )}
            </div>
          )}

          {items.length > 0 && (
            <Dropdown
              align={isOwn ? "right" : "left"}
              items={items}
              trigger={
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-text-muted",
                    "hover:bg-bg-hover hover:text-text-primary",
                    "opacity-60 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  )}
                >
                  <Ellipsis className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
              }
            />
          )}
        </div>
      </div>
    </ContextMenu>
  );
}
