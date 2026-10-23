"use client";

import { formatBytes } from "@/lib/formatBytes";

export interface FileCardProps {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  onOpen?: () => void;
}

function extensionOf(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}

export function FileCard({ fileName, mimeType, sizeBytes, onOpen }: FileCardProps) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 w-full max-w-xs rounded-[var(--radius-md)] border border-border-default bg-bg-elevated hover:bg-bg-hover px-3 py-2.5 text-left transition-colors"
    >
      <div
        className="shrink-0 h-10 w-10 rounded-[var(--radius-sm)] bg-accent-signal/15 text-accent-signal flex items-center justify-center font-mono text-[10px] font-semibold"
        aria-hidden
      >
        {extensionOf(fileName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary truncate">{fileName}</p>
        <p className="text-xs text-text-muted font-mono">
          {formatBytes(sizeBytes)} · {mimeType}
        </p>
      </div>
    </button>
  );
}
