"use client";

import { FileText, Paperclip, Send, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmojiPickerPlaceholder } from "@/components/ui/EmojiPicker";
import { uploadFile } from "@/lib/api/upload";

export interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, attachmentIds: string[]) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  /** Quoted message shown above the input while composing a reply. */
  replyTo?: { senderName: string; content: string } | null;
  onCancelReply?: () => void;
}

interface PendingAttachment {
  key: string;
  fileName: string;
  attachmentId: string | null; // null while uploading
  isImage: boolean;
  previewUrl: string | null; // local blob URL, only for images — revoked on removal/unmount
  error?: string;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  onTypingChange,
  disabled,
  replyTo,
  onCancelReply
}: MessageComposerProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  // Revoke every blob URL on unmount so we don't leak memory across a long session.
  useEffect(() => {
    return () => {
      pending.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(text: string) {
    onChange(text);
    onTypingChange?.(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTypingChange?.(false), 1500);
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      const isImage = file.type.startsWith("image/");
      // Local, instant preview — doesn't wait on the network upload at all.
      const previewUrl = isImage ? URL.createObjectURL(file) : null;

      setPending((prev) => [...prev, { key, fileName: file.name, attachmentId: null, isImage, previewUrl }]);

      try {
        const attachment = await uploadFile(file);
        setPending((prev) =>
          prev.map((p) => (p.key === key ? { ...p, attachmentId: attachment.id } : p))
        );
      } catch (err) {
        setPending((prev) =>
          prev.map((p) =>
            p.key === key ? { ...p, error: err instanceof Error ? err.message : "Upload failed" } : p
          )
        );
      }
    }
  }

  function removePending(key: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  }

  const isUploading = pending.some((p) => !p.attachmentId && !p.error);
  const readyAttachmentIds = pending.filter((p) => p.attachmentId).map((p) => p.attachmentId!);
  const canSend = (value.trim().length > 0 || readyAttachmentIds.length > 0) && !isUploading;

  function handleSend() {
    if (!canSend) return;
    onSend(value.trim(), readyAttachmentIds);
    onTypingChange?.(false);
    pending.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPending([]);
  }

  return (
    <div className="shrink-0 border-t border-border-subtle bg-bg-surface p-3">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-[var(--radius-sm)] border-l-2 border-accent-signal bg-bg-elevated px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-accent-signal">
              Replying to {replyTo.senderName}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {replyTo.content || "Attachment"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="shrink-0 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pending.map((p) => (
            <div
              key={p.key}
              className="relative flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-default bg-bg-elevated px-2 py-1 text-xs overflow-hidden"
            >
              {p.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob URL, next/image's remote-optimization pipeline doesn't apply here
                <img
                  src={p.previewUrl}
                  alt={p.fileName}
                  className="h-8 w-8 rounded-[var(--radius-sm)] object-cover shrink-0"
                />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.8} aria-hidden />
              )}
              <span className="max-w-[140px] truncate">{p.fileName}</span>
              {!p.attachmentId && !p.error && (
                <span className="h-3 w-3 rounded-full border-2 border-accent-signal border-t-transparent animate-spin shrink-0" />
              )}
              {p.error && <span className="text-danger shrink-0">failed</span>}
              <button
                onClick={() => removePending(p.key)}
                aria-label={`Remove ${p.fileName}`}
                className="text-text-muted hover:text-text-primary shrink-0"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-[var(--radius-lg)] bg-bg-elevated border border-border-default px-2 py-1.5 focus-within:outline-2 focus-within:outline-accent-signal">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={gifInputRef}
          type="file"
          accept=".gif,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          aria-label="Attach file"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-40"
        >
          <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Send a GIF"
          disabled={disabled}
          onClick={() => gifInputRef.current?.click()}
          className="h-9 px-2 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold tracking-wide text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-40"
        >
          GIF
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 resize-none bg-transparent py-2 text-sm text-text-primary placeholder:text-text-muted outline-none max-h-32"
        />

        <div className="relative">
          <button
            type="button"
            aria-label="Emoji"
            disabled={disabled}
            onClick={() => setShowEmoji((s) => !s)}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-40"
          >
            <Smile className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          {showEmoji && (
            <div className="absolute bottom-11 right-0 z-30">
              <EmojiPickerPlaceholder
                onSelect={(emoji) => {
                  handleChange(value + emoji);
                  setShowEmoji(false);
                  textareaRef.current?.focus();
                }}
                onClose={() => setShowEmoji(false)}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !canSend}
          aria-label="Send message"
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-accent-signal text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-signal-dim transition-colors"
        >
          <Send className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
