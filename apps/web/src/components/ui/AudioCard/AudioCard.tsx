"use client";

import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

import { resolveMediaUrl } from "@/lib/api/upload";
import { cn } from "@/lib/cn";

export interface AudioCardProps {
  url: string;
  fileName: string;
  isOwn?: boolean;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/** Inline player for voice messages (audio attachments). */
export function AudioCard({ url, fileName, isOwn }: AudioCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const src = resolveMediaUrl(url);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  return (
    <div
      className={cn(
        "flex w-64 max-w-full items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5",
        isOwn ? "bg-accent-signal text-white" : "bg-bg-elevated text-text-primary"
      )}
    >
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={playing ? `Pause voice message ${fileName}` : `Play voice message ${fileName}`}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
          isOwn ? "bg-white/20 hover:bg-white/30" : "bg-bg-base hover:bg-bg-hover"
        )}
      >
        {playing ? (
          <Pause className="h-4 w-4" strokeWidth={2} aria-hidden />
        ) : (
          <Play className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </button>

      <div className="min-w-0 flex-1">
        {/* A visible track with an invisible range input on top: native range
            styling is inconsistent across browsers, and the input keeps the
            control keyboard- and screen-reader-accessible. */}
        <div className="relative h-1.5 w-full">
          <div
            className={cn("absolute inset-0 rounded-full", isOwn ? "bg-white/30" : "bg-bg-base")}
            aria-hidden
          />
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", isOwn ? "bg-white" : "bg-accent-signal")}
            style={{ width: `${duration > 0 ? Math.min(100, (current / duration) * 100) : 0}%` }}
            aria-hidden
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            aria-label="Seek within voice message"
            onChange={(event) => {
              const next = Number(event.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setCurrent(next);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-mono opacity-80">
          <span>{formatDuration(current)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
      />
    </div>
  );
}
