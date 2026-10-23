"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { API_BASE_URL } from "@/lib/api/http-client";
import { formatBytes } from "@/lib/formatBytes";
import { useUiStore } from "@/stores/useUiStore";

export function FilePreviewModal() {
  const file = useUiStore((s) => s.filePreview);
  const close = useUiStore((s) => s.closeFilePreview);

  return (
    <Modal isOpen={!!file} onClose={close} title="File preview" size="md">
      {file && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-16 w-16 rounded-[var(--radius-md)] bg-accent-signal/15 text-accent-signal flex items-center justify-center font-mono text-xs font-semibold">
            {file.fileName.split(".").pop()?.toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-sm text-text-primary">{file.fileName}</p>
            <p className="text-xs text-text-muted font-mono mt-1">
              {formatBytes(file.sizeBytes)} · {file.mimeType}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={close}>
              Close
            </Button>
            {/* Hits a dedicated backend endpoint that sets Content-Disposition,
                rather than linking straight to the static /uploads/ URL with
                a plain <a download> — the download attribute is silently
                ignored by browsers for cross-origin links (frontend and API
                are different origins/ports), so that alone never actually
                forced a download. */}
            <a href={`${API_BASE_URL}/v1/media/${file.id}/download`}>
              <Button size="sm">Download</Button>
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}
