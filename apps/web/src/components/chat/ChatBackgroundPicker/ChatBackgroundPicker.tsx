"use client";

import { Check } from "lucide-react";

import { useLocale, type MessageKey } from "@/components/providers/LocaleProvider";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import {
  CHAT_BACKGROUNDS,
  useChatBackgroundStore,
  type ChatBackground
} from "@/stores/useChatBackgroundStore";

const LABEL_KEY: Record<ChatBackground, MessageKey> = {
  default: "chat.backgroundDefault",
  dots: "chat.backgroundDots",
  grid: "chat.backgroundGrid",
  waves: "chat.backgroundWaves",
  sunset: "chat.backgroundSunset",
  ocean: "chat.backgroundOcean",
  forest: "chat.backgroundForest",
  dusk: "chat.backgroundDusk"
};

export interface ChatBackgroundPickerProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Per-conversation chat background picker (opened from the chat header). */
export function ChatBackgroundPicker({ conversationId, isOpen, onClose }: ChatBackgroundPickerProps) {
  const { t } = useLocale();
  const current = useChatBackgroundStore((s) => s.byConversation[conversationId] ?? "default");
  const setBackground = useChatBackgroundStore((s) => s.setBackground);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("chat.background")} size="sm">
      <div className="grid grid-cols-2 gap-2">
        {CHAT_BACKGROUNDS.map((option) => {
          const active = current === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setBackground(conversationId, option.id)}
              aria-pressed={active}
              aria-label={t(LABEL_KEY[option.id])}
              className={cn(
                "relative h-20 overflow-hidden rounded-[var(--radius-md)] border text-start transition-colors",
                active ? "border-accent-signal" : "border-border-default hover:border-border-subtle"
              )}
            >
              {/* Renders the real CSS background, so the swatch is never a lie. */}
              <span
                className="chat-surface absolute inset-0 bg-bg-base"
                data-chat-bg={option.id === "default" ? undefined : option.id}
                aria-hidden
              />
              <span className="absolute inset-x-2 bottom-2 truncate text-[11px] font-medium text-text-primary">
                {t(LABEL_KEY[option.id])}
              </span>
              {active && (
                <Check className="absolute end-2 top-2 h-4 w-4 text-accent-signal" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-text-muted">{t("chat.backgroundHint")}</p>
    </Modal>
  );
}
