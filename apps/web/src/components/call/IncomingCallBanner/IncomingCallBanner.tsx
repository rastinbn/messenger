"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useCall } from "@/hooks/useCall";
import { useCallStore } from "@/stores/useCallStore";

export function IncomingCallBanner() {
  const incomingCall = useCallStore((s) => s.incomingCall);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const { joinCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-default bg-bg-elevated shadow-2xl px-4 py-3"
    >
      <Avatar name={incomingCall.fromUserId} size="sm" />
      <span className="text-sm">Incoming call…</span>
      <Button
        size="sm"
        onClick={() => {
          void joinCall(incomingCall.conversationId, true);
          setIncomingCall(null);
        }}
      >
        Answer
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setIncomingCall(null)}>
        Decline
      </Button>
    </div>
  );
}
