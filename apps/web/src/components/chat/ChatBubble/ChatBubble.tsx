"use client";

import type { Message } from "@messenger/shared-types";
import { Check, CheckCheck, CircleAlert, Clock, Ellipsis, Forward, type LucideIcon } from "lucide-react";

import { ContextMenu } from "@/components/ui/ContextMenu";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { FileCard } from "@/components/ui/FileCard";
import { ImageCard } from "@/components/ui/ImageCard";
import { cn } from "@/lib/cn";
import { formatMessageTime } from "@/lib/formatTime";
import { useUiStore } from "@/stores/useUiStore";

export interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
  showSender?: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

const statusIcon: Record<Message["status"], LucideIcon> = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: CircleAlert
};

export function ChatBubble({
  message,
  isOwn,
  senderName,
  showSender,
  onReply,
  onForward,
  onDelete
}: ChatBubbleProps) {
  const openImageViewer = useUiStore((s) => s.openImageViewer);
  const openFilePreview = useUiStore((s) => s.openFilePreview);

  const isDeleted = !!message.deletedAt;
  const quoted = message.replyTo;

  // A tombstone has no content to act on — only its timestamp is meaningful.
  const items: DropdownItem[] = isDeleted
    ? []
    : [
        ...(message.content
          ? [{ label: "Copy text", onSelect: () => navigator.clipboard.writeText(message.content) }]
          : []),
        { label: "Reply", onSelect: () => onReply?.(message) },
        { label: "Forward", onSelect: () => onForward?.(message) },
        ...(isOwn ? [{ label: "Delete", onSelect: () => onDelete?.(message), danger: true }] : [])
      ];

  return (
    <ContextMenu items={items}>
      <div
        className={cn(
          "group flex flex-col gap-1 max-w-[75%]",
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
          <div
            className={cn(
              "max-w-full rounded-[var(--radius-sm)] border-l-2 px-2.5 py-1.5 text-xs",
              isOwn
                ? "border-white/50 bg-white/10 text-white/80"
                : "border-accent-signal bg-bg-base text-text-secondary"
            )}
          >
            <p className="font-medium truncate">{quoted.senderName}</p>
            <p className="truncate">
              {quoted.deletedAt ? "Message deleted" : quoted.content || "Attachment"}
            </p>
          </div>
        )}

        {message.attachments.map((att) =>
          att.type === "image" ? (
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
          )
        )}

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
