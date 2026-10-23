"use client";

import Image from "next/image";

import { resolveMediaUrl } from "@/lib/api/upload";

export interface ImageCardProps {
  fileName: string;
  url?: string;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
  onOpen?: () => void;
}

const BASE_WIDTH = 320;

/**
 * Renders the real uploaded image when a URL is present. Uses explicit
 * width/height (scaled from the attachment's aspect ratio) rather than
 * `fill` — `fill` requires the parent element to have a real computed
 * height, and inside a chat bubble's shrink-to-fit flex layout
 * (items-start/items-end, no explicit width), the parent's height resolves
 * to 0, which silently breaks the image ("has fill and a height value of
 * 0" console warning, image not visible).
 */
export function ImageCard({ fileName, url, mimeType, width, height, onOpen }: ImageCardProps) {
  const resolvedUrl = url ? resolveMediaUrl(url) : null;
  const isGif = mimeType === "image/gif";

  // Default params (`width = 4`) only apply to `undefined`, not `null` —
  // and attachment.width/height are `number | null` from the API (nullable
  // when the uploader's browser didn't report dimensions), so a `null` was
  // silently slipping through, producing `null / null` = NaN and breaking
  // the image entirely. Coalesce explicitly instead of relying on default params.
  const safeWidth = width ?? 4;
  const safeHeight = height ?? 3;

  const aspectRatio = safeWidth / safeHeight;
  const displayHeight = Math.round(BASE_WIDTH / aspectRatio);

  return (
    <button
      onClick={onOpen}
      className="group relative block rounded-[var(--radius-md)] overflow-hidden border border-border-default bg-bg-elevated"
      style={{ width: BASE_WIDTH, maxWidth: "100%" }}
      aria-label={`Open ${isGif ? "GIF" : "image"} ${fileName}`}
    >
      {resolvedUrl ? (
        <Image
          src={resolvedUrl}
          alt={fileName}
          width={BASE_WIDTH}
          height={displayHeight}
          className="object-cover"
          style={{ width: "100%", height: "auto", display: "block" }}
          unoptimized
        />
      ) : (
        <div
          className="flex items-center justify-center bg-[linear-gradient(135deg,var(--bg-elevated),var(--bg-hover))]"
          style={{ width: "100%", aspectRatio: `${safeWidth} / ${safeHeight}` }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-text-muted opacity-60 group-hover:opacity-90 transition-opacity"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5-11 11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {isGif && (
        <span className="absolute top-1.5 right-1.5 text-[10px] font-bold tracking-wide text-white bg-black/60 rounded px-1.5 py-0.5">
          GIF
        </span>
      )}
      <span className="absolute bottom-1.5 left-2 text-[11px] text-white/90 bg-black/40 rounded px-1.5 py-0.5 truncate max-w-[85%]">
        {fileName}
      </span>
    </button>
  );
}
