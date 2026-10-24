"use client";

import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

export interface VideoTileProps {
  displayName: string;
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled?: boolean;
  muted?: boolean; // mute playback for the local tile to avoid echo
  isLocal?: boolean;
}

export function VideoTile({
  displayName,
  stream,
  videoEnabled,
  audioEnabled = true,
  muted,
  isLocal
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) {
      // Autoplay can be rejected until the tab has had a gesture; the call UI
      // itself is triggered by a click, so this normally resolves immediately.
      void el.play().catch(() => {});
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  const hasLiveVideo =
    !!stream && videoEnabled && stream.getVideoTracks().some((track) => track.readyState === "live");

  return (
    <div className="relative aspect-video rounded-[var(--radius-md)] overflow-hidden bg-bg-elevated flex items-center justify-center">
      {/*
        The <video> element stays mounted even when the camera is off: removing
        it also detaches the remote audio track, which made "they turned their
        camera off" sound like "they hung up".
      */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn(
            "h-full w-full object-cover",
            !hasLiveVideo && "opacity-0",
            isLocal && "scale-x-[-1]"
          )}
        />
      )}

      {!hasLiveVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={displayName} size="lg" />
        </div>
      )}

      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 text-xs text-white bg-black/50 rounded px-2 py-0.5">
        {displayName}
        {isLocal && " (you)"}
        {!audioEnabled && <MicOff className="h-3 w-3" aria-label="Muted" />}
      </span>
    </div>
  );
}
