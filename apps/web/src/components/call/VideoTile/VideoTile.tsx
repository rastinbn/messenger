"use client";

import { useEffect, useRef } from "react";

import { Avatar } from "@/components/ui/Avatar";

export interface VideoTileProps {
  displayName: string;
  stream: MediaStream | null;
  videoEnabled: boolean;
  muted?: boolean; // mute playback for the local tile to avoid echo
  isLocal?: boolean;
}

export function VideoTile({ displayName, stream, videoEnabled, muted, isLocal }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative aspect-video rounded-[var(--radius-md)] overflow-hidden bg-bg-elevated flex items-center justify-center">
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <Avatar name={displayName} size="lg" />
      )}
      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 rounded px-2 py-0.5">
        {displayName}
        {isLocal && " (you)"}
      </span>
    </div>
  );
}
