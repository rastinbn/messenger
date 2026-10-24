"use client";

import { Phone, PhoneOff, Video } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { answerCall, declineCall } from "@/lib/call/callEngine";
import { useCallStore } from "@/stores/useCallStore";

export function IncomingCallBanner() {
  const incomingCall = useCallStore((s) => s.incomingCall);

  if (!incomingCall) return null;

  // Falls back to the id only if the server payload predates fromDisplayName.
  const name = incomingCall.fromDisplayName ?? "Someone";
  const kind = incomingCall.video ? "video" : "voice";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-default bg-bg-elevated shadow-2xl px-4 py-3"
    >
      <Avatar name={name} size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          {incomingCall.video ? (
            <Video className="h-3 w-3" aria-hidden />
          ) : (
            <Phone className="h-3 w-3" aria-hidden />
          )}
          Incoming {kind} call
        </span>
      </div>
      <Button size="sm" className="gap-1.5" onClick={() => void answerCall()}>
        <Phone className="h-4 w-4" aria-hidden />
        Answer
      </Button>
      <Button size="sm" variant="ghost" className="gap-1.5" onClick={declineCall}>
        <PhoneOff className="h-4 w-4" aria-hidden />
        Decline
      </Button>
    </div>
  );
}
