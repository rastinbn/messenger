"use client";

import { MessageSquare } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";
import { useEffect } from "react";

/** "Home" state: no conversation selected yet. */
export default function ChatHomePage() {
  const setMobileConversationListOpen = useUiStore((s) => s.setMobileConversationListOpen);

  useEffect(() => {
    setMobileConversationListOpen(true);
  }, [setMobileConversationListOpen]);

  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-text-muted">
      <MessageSquare className="h-10 w-10" strokeWidth={1.4} aria-hidden />
      <p className="text-sm">Select a conversation to start chatting.</p>
    </div>
  );
}
