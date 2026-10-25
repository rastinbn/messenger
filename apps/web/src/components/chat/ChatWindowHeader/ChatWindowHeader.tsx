"use client";

import type { Conversation } from "@messenger/shared-types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, EllipsisVertical, Info, Palette, Phone, Video } from "lucide-react";
import { useState } from "react";

import { ChatBackgroundPicker } from "@/components/chat/ChatBackgroundPicker";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { useCall } from "@/hooks/useCall";
import { useUiStore } from "@/stores/useUiStore";

export interface ChatWindowHeaderProps {
  conversation: Conversation;
  currentUserId: string;
}

function displayName(conversation: Conversation, currentUserId: string): string {
  if (conversation.type === "group") return conversation.name ?? "Group";
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.displayName ?? "Unknown";
}

export function ChatWindowHeader({ conversation, currentUserId }: ChatWindowHeaderProps) {
  const router = useRouter();
  const { t } = useLocale();
  const setMobileConversationListOpen = useUiStore((s) => s.setMobileConversationListOpen);
  const { joinCall, inviteToCall } = useCall();
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const name = displayName(conversation, currentUserId);
  const other =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.id !== currentUserId)
      : undefined;

  const subtitle =
    conversation.type === "group"
      ? `${conversation.participants.length} members`
      : other?.status === "online"
        ? "Online"
        : other?.statusMessage ?? "Offline";

  async function startCall(video: boolean) {
    // Only invite once local media is actually running — otherwise the callee
    // gets a call the caller can never join.
    const joined = await joinCall(conversation.id, video);
    if (!joined) return;
    inviteToCall(conversation.id, video);
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 h-16 border-b border-border-subtle bg-bg-surface shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden text-text-muted hover:text-text-primary -ml-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-bg-hover"
            aria-label="Back to conversations"
            onClick={() => {
              setMobileConversationListOpen(true);
              router.push("/chat");
            }}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </button>
          <Avatar name={name} status={other?.status} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setBackgroundOpen(true)}
            aria-label={t("chat.background")}
            className="h-9 w-9 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover"
          >
            <Palette className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          <button
            onClick={() => void startCall(false)}
            aria-label="Start voice call"
            className="h-9 w-9 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover"
          >
            <Phone className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          <button
            onClick={() => void startCall(true)}
            aria-label="Start video call"
            className="h-9 w-9 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover"
          >
            <Video className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          {conversation.type === "direct" && other && (
            <Link
              href={`/profile/${other.id}`}
              className="h-9 w-9 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover"
              aria-label="View profile"
            >
              <Info className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            </Link>
          )}
          <Dropdown
            trigger={
              <span className="h-9 w-9 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover">
                <EllipsisVertical className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              </span>
            }
            items={[
              { label: "Mute conversation", onSelect: () => {} },
              { label: "Search in conversation", onSelect: () => {} },
              { label: "Delete conversation", onSelect: () => {}, danger: true }
            ]}
          />
        </div>
      </header>

      <ChatBackgroundPicker
        conversationId={conversation.id}
        isOpen={backgroundOpen}
        onClose={() => setBackgroundOpen(false)}
      />
    </>
  );
}
