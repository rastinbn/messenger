"use client";

import Image from "next/image";

import { Modal } from "@/components/ui/Modal";
import { resolveMediaUrl } from "@/lib/api/upload";
import { useUiStore } from "@/stores/useUiStore";

/** Global image viewer — opened via useUiStore.openImageViewer from anywhere (chat, file previews). */
export function ImageViewerModal() {
  const image = useUiStore((s) => s.imageViewer);
  const close = useUiStore((s) => s.closeImageViewer);
  const resolvedUrl = image?.url ? resolveMediaUrl(image.url) : null;

  return (
    <Modal isOpen={!!image} onClose={close} title={image?.fileName} size="full">
      <div className="flex items-center justify-center min-h-[50vh] bg-black/30 rounded-[var(--radius-md)] relative">
        {resolvedUrl ? (
          <Image
            src={resolvedUrl}
            alt={image?.fileName ?? ""}
            width={1200}
            height={800}
            className="max-h-[80vh] w-auto h-auto object-contain rounded-[var(--radius-md)]"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-text-muted p-10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5-11 11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p className="text-sm">{image?.fileName}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
