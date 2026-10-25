"use client";

import { MessageSquare } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";
import { useEffect } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

/** "Home" state: no conversation selected yet. */
export default function ChatHomePage() {
  const { t } = useLocale();
  const setMobileConversationListOpen = useUiStore((s) => s.setMobileConversationListOpen);

  useEffect(() => {
    setMobileConversationListOpen(true);
  }, [setMobileConversationListOpen]);

  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-text-muted">
      <MessageSquare className="h-10 w-10" strokeWidth={1.4} aria-hidden />
      <p className="text-sm">{t("chat.selectConversation")}</p>
    </div>
  );
}
